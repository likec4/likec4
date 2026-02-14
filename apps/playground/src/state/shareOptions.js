export var ShareOptions;
(function (ShareOptions) {
    ShareOptions.ExpiresValues = [
        { value: 'D1', label: '1 day' },
        { value: 'D7', label: '7 days' },
        { value: 'M1', label: '1 month' },
        { value: 'M3', label: '3 months' },
        { value: 'M6', label: '6 months' },
    ];
    ShareOptions.isValidExpires = (c) => ShareOptions.ExpiresValues.some(opt => opt.value === c);
    ShareOptions.AccessValues = [
        { value: 'any', label: 'Anyone with the link' },
        { value: 'pincode', label: 'With pincode' },
        { value: 'github:team', label: 'Github Team' },
        { value: 'github:org', label: 'Github Organization' },
    ];
    ShareOptions.isValidAccess = (c) => ShareOptions.AccessValues.some(opt => opt.value === c);
})(ShareOptions || (ShareOptions = {}));
