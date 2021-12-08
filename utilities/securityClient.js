import { pki, md, random, cipher, util } from "node-forge";


export default function SecurityClient(){

    /**
     * @type {object}
     */
    let sessionKey = null;

    /**
     * @type {pki.rsa.PublicKey}
     */
    let publicKey = null;
    
    /**
     * @type {pki.rsa.PrivateKey}
     */
    let privateKey = null;


    this.generateKeyPair = function(){
        
        const keyPair = pki.rsa.generateKeyPair(1024);
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
    }

    this.generateSessionKey = function(){
        
        // AES-cbc key (2 parts main key = initialization vector, of same length ) 
        sessionKey = {};
        sessionKey.key = random.getBytesSync(16);
        sessionKey.iv = random.getBytesSync(16);
    }

    this.exportPublicKey = function(){
        return pki.publicKeyToPem(publicKey);
    }

    this.exportSessionKey = function(userPublicKeyPem){
        
        const stringifiedSessionKey = JSON.stringify(sessionKey);
        const signature = privateKey.sign(md.sha256.create().update(stringifiedSessionKey));

        //prepare user's public key
        const userPublicKey = pki.publicKeyFromPem(userPublicKeyPem);


        return {
            encryptedKey: userPublicKey.encrypt(stringifiedSessionKey),
            signature: signature
        }
    }

    this.importSessionKey = function(encryptedKey, signature, masterPublicKeyPem){

        try {
            const plainKey = privateKey.decrypt(encryptedKey);
            const masterPublicKey = pki.publicKeyFromPem(masterPublicKeyPem);
            const isValid = masterPublicKey.verify(md.sha256.create().update(plainKey)
                                            .digest().bytes(), signature);
            
            
            if(isValid){
                sessionKey = JSON.parse(plainKey);
            }

            return isValid;
       
        } catch (error) {

            return false;
        }
            
    }

    this.encryptMsg = function(msg){
        
        let cipherBlock = cipher.createCipher("AES-CBC", sessionKey.key);
        cipherBlock.start({"iv": sessionKey.iv});
        cipherBlock.update( util.createBuffer(msg));
        cipherBlock.finish();

        return cipherBlock.output.bytes();
    }

    this.decryptMsg = function(encryptedMsg){
        
        let decipherBlock = cipher.createDecipher("AES-CBC", sessionKey.key);
        decipherBlock.start({"iv": sessionKey.iv}); 
        decipherBlock.update( util.createBuffer(encryptedMsg) );
        decipherBlock.finish();

        return decipherBlock.output.bytes();
    }

}

