const shortAddress = (address) => {
    return address.substring(0, 8) + '...' + address.substring(address.length - 8);
}

export default shortAddress;