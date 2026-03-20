import { MD5Util } from "./md5.ts"
import fs from "fs"
import { homedir } from "os"

export class Cache {
    private basePath: string
    constructor({ basePath }: { basePath: string }) {
        this.basePath = basePath
    }

    async get(key: string, defaultValue: any = null) {
        try {
            const encrypedKey = MD5Util.getMd5(key)
            const filePath = `${this.basePath}/${encrypedKey}`
            if (!fs.existsSync(filePath)) {
                return defaultValue
            }

            const data = fs.readFileSync(filePath).toString()
            const json = JSON.parse(data)

            // 过期
            if (json.expireAt < Date.now()) {
                return defaultValue
            }
            return json.value
        } catch (e) {
            return defaultValue
        }
    }

    async set(key: string, value: any, ttl: number) {
        const encrypedKey = MD5Util.getMd5(key)
        fs.writeFileSync(`${this.basePath}/${encrypedKey}`, JSON.stringify({
            value,
            ttl,
            expireAt: Date.now() + ttl * 1000
        }))
    }
}


export const cache = new Cache({
    basePath: `${homedir}/Library/Caches/com.frostyeve.enconvo/cache`, // (optional) Path where cache files are stored (default).
});