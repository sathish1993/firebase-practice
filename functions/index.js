const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


const nodemailer = require('nodemailer');
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
	service: 'gmail',
		auth: {
		user: gmailEmail,
		pass: gmailPassword,
	},
});

const APP_NAME = 'Collab Scribble';

exports.sendWelcomeEmail = functions.firestore
	.document('scribble/{docId}')
	.onCreate(event => {
		const newValue = event.data.data();
		const usersToInvite = newValue.inviteeList;
		const ownerName = newValue.ownerName;
		const inviteURL = newValue.inviteURL;

		//Send mail to guests with this URL. Code to be done
		for (index = 0; index < usersToInvite.length; ++index) {
		    console.log(usersToInvite[index]);
		    sendWelcomeEmail(usersToInvite[index], ownerName, inviteURL);
		}
		window.alert("Mail invites has been sent to all the guests");
	})

function sendWelcomeEmail(email, ownerName, inviteURL) {
	const mailOptions = {
		from: `${APP_NAME} <noreply@scribble.com>`,
		to: email,
	};

	// The user subscribed to the newsletter.
	mailOptions.subject = `Welcome to ${APP_NAME}!`;
	mailOptions.text = `Hello,\n\t\tWelcome to ${APP_NAME}. Please use this link ${inviteURL} to collaborate with ${ownerName}. I hope you will enjoy our service. \n\nRegards,\nScribble Team.`;
	return mailTransport.sendMail(mailOptions).then(() => {
		return console.log('New welcome email sent to:', email);
	});
}