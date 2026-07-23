// https://www.npmjs.com/package/zeptomail

// For ES6
import { SendMailClient } from "zeptomail";

// For CommonJS
// var { SendMailClient } = require("zeptomail");

const url = "https://api.zeptomail.in/v1.1/email";
const token = "Zoho-enczapikey ********";

let client = new SendMailClient({url, token});

client.sendMail({
    "from": 
    {
        "address": "noreply@plantingarden.com",
        "name": "noreply"
    },
    "to": 
    [
        {
        "email_address": 
            {
                "address": "vaibhavbiotech999@gmail.com",
                "name": "vaibhavbiotech999"
            }
        }
    ],
    "subject": "Test Email",
    "htmlbody": "<div><b> Test email sent successfully.</b></div>",
}).then((resp) => console.log("success")).catch((error) => console.log("error"));


-----------------------
sender address plantingarden.com
host api.zeptomail.in
agent alias 55980990960269d3
send mail token 1 Zoho-enczapikey PHtE6r0PQ+m92mUt8xEEt/O5QMfxY4soqek0LghF5dpAW/JVFk0Go4t4wTC1/R9+B/NFQqWSyINtubyZ4eKBJzrrN2geX2qyqK3sx/VYSPOZsbq6x00fs1ofdU3eXI/vet5u1yDWvtvZNA==