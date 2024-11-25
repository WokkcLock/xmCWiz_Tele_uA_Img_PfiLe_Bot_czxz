import { ParsedUrlQueryInput } from "querystring";

abstract class AbstractFetcher {
  abstract GetJson(url: string, param?: ParsedUrlQueryInput): Promise<any>;

  abstract GetByteFile(
    url: string,
    params?: ParsedUrlQueryInput,
  ): Promise<Buffer>;

  abstract Init(): any;
}

export default AbstractFetcher;
