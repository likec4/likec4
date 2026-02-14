export type ShareOptions = {
    expires: ShareOptions.ExpiresValue;
    forkable: boolean;
    access: Exclude<ShareOptions.AccessValue, 'pincode'>;
} | {
    expires: ShareOptions.ExpiresValue;
    forkable: boolean;
    access: 'pincode';
    pincode: string;
};
export declare namespace ShareOptions {
    const ExpiresValues: readonly [{
        readonly value: "D1";
        readonly label: "1 day";
    }, {
        readonly value: "D7";
        readonly label: "7 days";
    }, {
        readonly value: "M1";
        readonly label: "1 month";
    }, {
        readonly value: "M3";
        readonly label: "3 months";
    }, {
        readonly value: "M6";
        readonly label: "6 months";
    }];
    type ExpiresValue = typeof ExpiresValues[number]['value'];
    const isValidExpires: (c: unknown) => c is ExpiresValue;
    const AccessValues: readonly [{
        readonly value: "any";
        readonly label: "Anyone with the link";
    }, {
        readonly value: "pincode";
        readonly label: "With pincode";
    }, {
        readonly value: "github:team";
        readonly label: "Github Team";
    }, {
        readonly value: "github:org";
        readonly label: "Github Organization";
    }];
    type AccessValue = typeof AccessValues[number]['value'];
    const isValidAccess: (c: unknown) => c is AccessValue;
}
