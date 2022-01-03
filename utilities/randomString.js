function generateRandomString(){
    let numString = "";

    numString += (Math.random() * 10e100).toString(16).substring(0, 10);
    numString += (Math.random() * 10e100).toString(16).substring(0, 10);
    numString += (Math.random() * 10e100).toString(16).substring(0, 10);


    return Buffer.from(numString, "hex").toString("base64").substring(0,15).replace (/\//, "Q").replace(/\+/, "K");

}

module.exports = generateRandomString;