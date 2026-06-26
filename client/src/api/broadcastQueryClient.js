const QUERY_BROADCAST_CHANNEL = "badminton-booking-react-query";
const CLASS_DELETED_STORAGE_KEY = "badminton-booking-class-deleted";
const tabId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
let queryBroadcastChannel = null;

const shouldBroadcastQuery = (query) => {
    return Array.isArray(query.queryKey);
};

const removeClassFromCachedList = (currentData, classId) => {
    const classes = currentData?.data?.classes;

    if (!Array.isArray(classes)) {
        return currentData;
    }

    const nextClasses = classes.filter((classItem) => (classItem._id || classItem.id) !== classId);
    if (nextClasses.length === classes.length) {
        return currentData;
    }

    return {
        ...currentData,
        data: {
            ...currentData.data,
            classes: nextClasses,
            results: Math.max(Number(currentData.data.results ?? classes.length) - 1, 0),
        },
    };
};

export const removeDeletedClassFromCache = (queryClient, classId) => {
    queryClient.setQueriesData({ queryKey: ["classes"] }, (currentData) =>
        removeClassFromCachedList(currentData, classId)
    );
    queryClient.setQueriesData({ queryKey: ["admin", "classes"] }, (currentData) =>
        removeClassFromCachedList(currentData, classId)
    );
    queryClient.removeQueries({ queryKey: ["classes", "detail", classId], exact: true });
};

export const broadcastClassDeleted = (classId) => {
    if (typeof window === "undefined") {
        return;
    }

    const message = {
        type: "classDeleted",
        classId,
        source: tabId,
        sentAt: Date.now(),
    };

    if ("BroadcastChannel" in window) {
        const channel = queryBroadcastChannel || new BroadcastChannel(QUERY_BROADCAST_CHANNEL);
        channel.postMessage(message);

        if (!queryBroadcastChannel) {
            channel.close();
        }
    }

    try {
        localStorage.setItem(CLASS_DELETED_STORAGE_KEY, JSON.stringify(message));
    } catch {
        // Ignore storage failures; BroadcastChannel already handled the primary path.
    }
};

export function broadcastQueryClient(queryClient) {
    if (typeof window === "undefined") {
        return () => {};
    }

    const channel = "BroadcastChannel" in window ? new BroadcastChannel(QUERY_BROADCAST_CHANNEL) : null;
    queryBroadcastChannel = channel;
    let isApplyingRemoteEvent = false;

    const postMessage = (message) => {
        if (!channel) return;

        channel.postMessage({
            ...message,
            source: tabId,
        });
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (isApplyingRemoteEvent || !event.query || !shouldBroadcastQuery(event.query)) {
            return;
        }

        const { query, type } = event;

        if (type === "removed") {
            postMessage({
                type: "remove",
                queryKey: query.queryKey,
            });
            return;
        }

        if (type !== "updated") {
            return;
        }

        if (event.action.type === "invalidate") {
            postMessage({
                type: "invalidate",
                queryKey: query.queryKey,
            });
            return;
        }

        if (event.action.type === "success" && query.state.status === "success") {
            postMessage({
                type: "success",
                queryKey: query.queryKey,
                data: query.state.data,
                dataUpdatedAt: query.state.dataUpdatedAt,
            });
        }
    });

    const applyClassDeleted = (classId) => {
        removeDeletedClassFromCache(queryClient, classId);
        queryClient.invalidateQueries({
            queryKey: ["classes"],
            refetchType: "active",
        });
    };

    const handleMessage = (message) => {
        if (!message || message.source === tabId) {
            return;
        }

        isApplyingRemoteEvent = true;

        try {
            if (message.type === "classDeleted" && message.classId) {
                applyClassDeleted(message.classId);
                return;
            }

            if (!Array.isArray(message.queryKey)) {
                return;
            }

            if (message.type === "remove") {
                queryClient.removeQueries({ queryKey: message.queryKey, exact: true });
                return;
            }

            if (message.type === "invalidate") {
                queryClient.invalidateQueries({
                    queryKey: message.queryKey,
                    refetchType: "active",
                });
                return;
            }

            if (message.type === "success") {
                const currentState = queryClient.getQueryState(message.queryKey);

                if ((currentState?.dataUpdatedAt ?? 0) <= message.dataUpdatedAt) {
                    queryClient.setQueryData(message.queryKey, message.data, {
                        updatedAt: message.dataUpdatedAt,
                    });
                }
            }
        } finally {
            isApplyingRemoteEvent = false;
        }
    };

    if (channel) {
        channel.onmessage = (event) => handleMessage(event.data);
    }

    const handleStorage = (event) => {
        if (event.key !== CLASS_DELETED_STORAGE_KEY || !event.newValue) {
            return;
        }

        try {
            handleMessage(JSON.parse(event.newValue));
        } catch {
            // Ignore malformed storage payloads from old tabs or manual edits.
        }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
        unsubscribe();
        window.removeEventListener("storage", handleStorage);
        channel?.close();
        if (queryBroadcastChannel === channel) {
            queryBroadcastChannel = null;
        }
    };
}
