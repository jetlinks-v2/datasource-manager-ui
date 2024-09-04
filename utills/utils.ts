/**
 * 生成随机数
 * @param length
 * @returns
 */
export const randomString = (length?: number) => {
    const tempLength = length || 32;
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    const maxPos = chars.length;
    let pwd = '';
    for (let i = 0; i < tempLength; i += 1) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
};