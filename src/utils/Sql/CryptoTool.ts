import bcrypt from "bcryptjs";
import fs from "fs";

export default class CryptoTool {
    private static salt: string | undefined;
    private static getSalt() {
        if (CryptoTool.salt === undefined) {
            if (fs.existsSync("private/salt")) {
                CryptoTool.salt = fs.readFileSync("private/salt").toString();
            } else {
                const newSalt = bcrypt.genSaltSync(10);
                fs.writeFileSync("private/salt", newSalt);
                CryptoTool.salt = newSalt;
            }
        }
        return CryptoTool.salt!;
    }
    static async hash(data: string) {
        return await bcrypt.hash(data, CryptoTool.getSalt());
    }

    static async verify(data: string, hash: string) {
        return await bcrypt.compare(data, hash);
    }
}
