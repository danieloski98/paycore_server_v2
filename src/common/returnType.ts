export class ReturnType {
    success: boolean;
    data: any;
    message: string;

    constructor({ success, data, message }: ReturnType) {
        this.success = success;
        this.data = data;
        this.message = message;
    }
}