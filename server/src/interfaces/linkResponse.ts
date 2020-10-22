import { Link } from "./link";

export enum Status {
  UNKNOWN = "UNKNOWN",
  OK = "OK",
  FAILED = "FAILED",
}

export class LinkResponse {
  private constructor(
    private status: Status,
    private msg: string,
    private data?: Link
  ) {}

  isOK(): boolean {
    return this.status === Status.OK;
  }

  isEmpty(): boolean {
    return this.data == undefined;
  }

  getData(): Link | undefined {
    if (this.isOK()) {
      return this.data;
    }
    return undefined;
  }

  getMsg(): string {
    return this.msg;
  }

  public static success(data?: Link, msg: string = "success"): LinkResponse {
    return new LinkResponse(Status.OK, msg, data);
  }

  public static fail(msg: string): LinkResponse {
    return new LinkResponse(Status.FAILED, msg);
  }

  static fromJson(json: string): LinkResponse | undefined {
    const jsonObj = JSON.parse(json);

    if (!jsonObj) return undefined;

    if (!jsonObj.hasOwnProperty("status")) return undefined;

    let status: Status = Status.UNKNOWN;
    switch (jsonObj["status"]) {
      case Status.OK.toString():
        status = Status.OK;
        break;
      case Status.FAILED.toString():
        status = Status.FAILED;
        break;
      default:
        status = Status.UNKNOWN;
    }

    let msg = jsonObj["msg"];

    let link: Link | undefined;
    const data = jsonObj["data"];
    if (data) {
      link = {
        originalLink: data["originalLink"],
        shortLink: data["shortLink"],
        creationDate: data["creationDate"],
        usageCount: data["usageCount"] ?? 0,
      };
    }

    return new LinkResponse(status, msg, link);
  }
}
