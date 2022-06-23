function payMe(){
    let notice = "Email me at doubleudoubleudotnetdot.org and send me money plz!!";
    alert(notice);
};

function getInputValue(){
    let inputValue = document.getElementById("inputId").value;
    alert(`Who is ${inputValue} anyway?`);
};

function random(){
    document.getElementById("rh3").innerHTML = "Waaaa";
};

function login(useConditionalMediation) {
    console.log("login");

    if (useConditionalMediation) {
        if (!PublicKeyCredential.isConditionalMediationAvailable || !PublicKeyCredential.isConditionalMediationAvailable()) {
            console.log("Returning early from login because useConditionalMediation was specified but conditional mediation isn't available.");
            return false;
        }
    } else {
        let = passwordIsVisible = getComputedStyle(document.getElementById("passwordStuff")).display === "block";

        let username = document.getElementById("username-field").value;
        let password = document.getElementById("password").value;
        if (!passwordIsVisible && (/\d$/.test(username) || /other/i.test(username) || /password/i.test(username))) {
            setTimeout(function() {
                document.getElementById("passwordStuff").style.display = "block";
                document.getElementById("password").focus();
            }, 300);
            return false;
        }

        if (passwordIsVisible && username.length && password.length) {
            console.log("Success");
            setTimeout(function() {
                window.location = "loggedin.html";
            }, 500);
            return false;
        }
    }

    var signInOptions = {
        challenge: new Uint8Array([0, 1, 2, 3])
    };

    var options = {
        "publicKey": signInOptions
    }
    if (useConditionalMediation)
        options.mediation = "conditional";

    console.log("Calling navigator.credentials.get with options: ", options);
    navigator.credentials.get(options)
        .then(function(assertion) {
            console.log("Success");
            window.location = "loggedin.html";
        }).catch(function(error) {
            console.log("Failed");
            console.log(error);
        });
    return false;
}

function register() {
    console.log("Registering passkey.");
    var username = document.getElementById("username-field").value;
    var creationOptions = {
        challenge: new Uint8Array([0, 1, 2, 3]),
        rp: {
            name: "Testing House",
            id: location.hostname
        },
        user: {
            id: new Uint8Array(16),
            name: username,
            displayName: username
        },
        pubKeyCredParams: [{
            type: "public-key",
            alg: -7
        }]
    };
    console.log(creationOptions);

    navigator.credentials.create({
            "publicKey": creationOptions
        })
        .then(function(passkey) {
            console.log("Success");
            console.log(passkey);
        }).catch(function(error) {
            console.log("Failed");
            console.log(error);
        });
}

window.addEventListener('load', (event) => {
    setTimeout(function() {
        document.querySelector("#username-field").focus();
    }, 1000);
});