export const tokenStorage = {
    // Frontend không còn lưu token ở local nữa vì đã dùng HTTP-only Cookie
    getToken: () => null,
    setToken: () => { },
    clearToken: () => { },
};