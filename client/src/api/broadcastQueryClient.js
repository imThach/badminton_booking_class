const QUERY_BROADCAST_CHANNEL = "badminton-booking-react-query";
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

    return {
        ...currentData,
        data: {
            ...currentData.data,
            classes: classes.filter((classItem) => (classItem._id || classItem.id) !== classId),
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
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
        return;
    }

    const channel = queryBroadcastChannel || new BroadcastChannel(QUERY_BROADCAST_CHANNEL);
    channel.postMessage({
        type: "classDeleted",
        classId,
        source: tabId,
    });

    if (!queryBroadcastChannel) {
        channel.close();
    }
};

export function broadcastQueryClient(queryClient) {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
        return () => {};
    }

    const channel = new BroadcastChannel(QUERY_BROADCAST_CHANNEL);
    queryBroadcastChannel = channel;
    let isApplyingRemoteEvent = false;

    const postMessage = (message) => {
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

    channel.onmessage = (event) => {
        const message = event.data;

        if (!message || message.source === tabId) {
            return;
        }

        isApplyingRemoteEvent = true;

        try {
            if (message.type === "classDeleted" && message.classId) {
                removeDeletedClassFromCache(queryClient, message.classId);
                queryClient.invalidateQueries({
                    queryKey: ["classes"],
                    refetchType: "active",
                });
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

    return () => {
        unsubscribe();
        channel.close();
        if (queryBroadcastChannel === channel) {
            queryBroadcastChannel = null;
        }
    };
}
