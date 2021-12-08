import SecurityClient from "../utilities/securityClient";



test("generating KeyPair, probs the publicKey", ()=>{
        const securityClient = new SecurityClient();
        securityClient.generateKeyPair();
        const pk = securityClient.exportPublicKey();
        const keyFormat = /BEGIN PUBLIC KEY([^]*)END PUBLIC KEY/;
        const ok = keyFormat.test(pk);
        expect(ok).toBe(true);
});

test("exchange message between two clients", ()=>{
        
        //initiating master
        const clientMaster = new SecurityClient();
        clientMaster.generateKeyPair();
        clientMaster.generateSessionKey();
        const masterPK = clientMaster.exportPublicKey();

        //initiating slave
        const clientSlave = new SecurityClient();
        clientSlave.generateKeyPair();
        const slavePK = clientSlave.exportPublicKey();

        //exporting session key
        const sessionKeyObject = clientMaster.exportSessionKey(slavePK);

        //importing session key
        clientSlave.importSessionKey(sessionKeyObject.encryptedKey, sessionKeyObject.signature, masterPK);

        const msg = "hello dudes";

        const cipher = clientMaster.encryptMsg(msg);
        const recievedMsg = clientSlave.decryptMsg(cipher);

        expect(msg).toEqual(recievedMsg);
});

test("detecting tampered sessionKey", ()=>{

        //initiating master
        const clientMaster = new SecurityClient();
        clientMaster.generateKeyPair();
        clientMaster.generateSessionKey();
        const masterPK = clientMaster.exportPublicKey();

        //initiating slave
        const clientSlave = new SecurityClient();
        clientSlave.generateKeyPair();
        const slavePK = clientSlave.exportPublicKey();

        //exporting session key
        const sessionKeyObject = clientMaster.exportSessionKey(slavePK);
        
        //tamper with the key
        let bufferedKey = Buffer.from(sessionKeyObject.encryptedKey);
        bufferedKey[0] = 28;
        sessionKeyObject.encryptedKey = bufferedKey.toString();

        //importing session key
        const valid = clientSlave.importSessionKey(sessionKeyObject.encryptedKey, sessionKeyObject.signature, masterPK);
        
        expect(valid).toEqual(false);
});


