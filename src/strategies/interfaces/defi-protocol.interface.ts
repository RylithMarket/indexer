export interface IValuableObject {
  canHandle(type: string): boolean;
  calculatePrice(id: string): Promise<number>;
}

export interface PositionInfo {
  objectId: string;
  type: string;
  protocol: string;
  valueUsd: number;
}
