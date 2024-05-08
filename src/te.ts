import DanbooruApi from "./utils/DanbooruApi.js";
import UserCacheManager from "./utils/User/UserCacheManager.js";
export async function te1() {
  const dan = await DanbooruApi.Create();
  const ucMan = new UserCacheManager();
}
