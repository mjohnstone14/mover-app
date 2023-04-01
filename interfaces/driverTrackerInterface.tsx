export interface Coordinate {
    latitude: number;
    longitude: number;
    timestamp: string;
}

export interface Phone {
    nationalNumber: string;
    countryCallingCode: string;
}

export interface Driver {
    id: string;
    name: string;
    phone: Phone;
    os: string;
    version: string;
}
