// Initialize Firebase
var config = {
	apiKey: "AIzaSyCYOoDHWt57G8nqGUzge5YEALVQ9-pmxWk",
    authDomain: "scribble-195323.firebaseapp.com",
    databaseURL: "https://scribble-195323.firebaseio.com",
    projectId: "scribble-195323",
    storageBucket: "scribble-195323.appspot.com",
    messagingSenderId: "127518828598"
};

firebase.initializeApp(config);
var usersToInvite = [];
var initText = "Start Collab Scribbling";
var idleTime = 0;

window.onload = function (event) {
	var curURL = window.location.href;
	if(curURL.indexOf("?") != -1) {
		hideButtons();
	}
}

function startCollab() {

	//Corner case to check if start collab is pressed without adding guests
	if(window.location.href.indexOf("?") == -1 && usersToInvite.length == 0) {
		window.alert("Please add guests to collaborate");
		return;
	}
		
	//Fire store
	var firestore = firebase.firestore();
	var collection = firestore.collection("scribble");
	var curURL = window.location.href;
	var collabtextpad = document.createElement("div");
	var docId;

	//Google sign in
	var provider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(provider).then(function(result) {
		var token = result.credential.accessToken;
		var user = result.user;
		console.log(user);

		if(curURL.indexOf("?") == -1) {
			//Person(owner) initiates collab text
			docId = proceedAsOwner(collection, curURL, collabtextpad, user);
		} else {
			//Person is an invited guest
			docId = proceedAsGuest(collection, curURL, collabtextpad, user);	
		}
		//Content editable div
		collabtextpad.setAttribute("contenteditable", "true");
		collabtextpad.setAttribute("id", "collabtextpad");

		//Keypress event to check if db can be updated with new text		
		collabtextpad.addEventListener('keyup',function(event){
			idleTime = 0;
		});
		document.body.appendChild(collabtextpad);
		document.getElementById("collabBtn").disabled = 'true';	
		var idleInterval = setInterval(function() { listenAndAppendNewChanges(collection, docId)}, 999);	
	}).catch(function(error) {
		console.log(error)
	});
	
}

function proceedAsOwner(collection, curURL, collabtextpad, user) {
	var docRef = collection.doc();
	var inviteURL = curURL;
	if(inviteURL.indexOf('?') > -1){
		inviteURL = inviteURL + "&doc=" + docRef.id;
	} else {
		inviteURL = inviteURL + "?doc=" + docRef.id;
	}
	console.log(inviteURL);

	docRef.set({//New document creation
		ownerName: user.displayName,
		ownerEmail: user.email,
		inviteeList: usersToInvite,
		text: initText,
		inviteURL: inviteURL
	}).then(function() {
		collabtextpad.innerHTML = initText;
		hideButtons();
		document.getElementById("dynamic-list").style.display = "none";
		listenAndAppendNewChanges(collection, docRef.id);
	}).catch(function(error) {
		console.log(error);
	});
	return docRef.id;
}

function proceedAsGuest(collection, curURL, collabtextpad, user) {
	var url = new URL(curURL);
	var docId = url.searchParams.get("doc");
	collection.doc(docId).get().then(function(doc) {
    	if (doc.exists) {
        	//check if current user is invited
        	var validUsers = doc.data().inviteeList;
        	var index = validUsers.indexOf(user.email);
        	if(index > -1) {
        		collabtextpad.innerHTML = doc.data().text;
        		listenAndAppendNewChanges(collection, docId);
        	} else {
        		window.alert("You do not have permissions to view this");
        		window.close();
        	}
    	} else {
    		console.log("No such doc");	
    	}
	}).catch(function(error) {
		console.log(error);
	});
	return docId;
}

function getCurrentValue(collection, docId) {
	return collection.doc(docId).get().then(function(newDoc) {
		if(newDoc && newDoc.exists) {
			return newDoc.data().text;		
		} else {
			console.log("No such document exists");
		}	
	}).catch(function(error) {
		console.log(error);
	});
}

function listenAndAppendNewChanges(collection, docId) {
	idleTime = idleTime + 1;

	if(document.getElementById("collabtextpad").innerText == initText) {
		getCurrentValue(collection, docId).then((prevValue) => {
			document.getElementById("collabtextpad").value = prevValue;
		});
    }

   getCurrentValue(collection, docId).then((prevValue) => {
   	console.log("prevValue " + prevValue);
    	if(idleTime > 1){
    		if(document.getElementById("collabtextpad").innerText != prevValue) {
    			console.log(document.getElementById("collabtextpad").innerText);
    			collection.doc(docId).update({
    				text : document.getElementById("collabtextpad").innerText
    			}).then(()=>{
    				getCurrentValue(collection, docId).then((updatedValue) => {
    					document.getElementById("collabtextpad").value = updatedValue;	
    				});
    			})
    		}
    	}
    });
}

function hideButtons() {
	document.getElementById("add").style.display = "none";
	document.getElementById("remove").style.display = "none";
	document.getElementById("candidate").style.display = "none";
}

function addItem() {
    var ul = document.getElementById("dynamic-list");
    var candidate = document.getElementById("candidate");
    var reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if(reg.test(candidate.value) == true) {
		var index = usersToInvite.indexOf(candidate.value);

		if(index == -1) {
			usersToInvite.push(candidate.value);
			var li = document.createElement("li");
			li.setAttribute('id',candidate.value);
			li.appendChild(document.createTextNode(candidate.value));
			ul.appendChild(li);
			document.getElementById("candidate").value = "";
			console.log(usersToInvite);
		}
	} else {
		alert("Please enter a valid email");
	}
}

function removeItem() {
    var ul = document.getElementById("dynamic-list");
    var candidate = document.getElementById("candidate");
    var index = usersToInvite.indexOf(candidate.value);
    if(index > -1) {
    	usersToInvite.splice(index, 1);
    	var item = document.getElementById(candidate.value);
    	ul.removeChild(item);
    	document.getElementById("candidate").value = "";
    	console.log(usersToInvite);
	}
}