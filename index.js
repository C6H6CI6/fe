const { Muta, Account } = require("muta-sdk");
const Mustache = require("mustache");
const $ = require("jquery");

import thumbup_image from "./assets/thumbup.svg";
import comment_image from "./assets/comment.svg";
import m_image from "./assets/m.svg";
import avatar_image from "./assets/avatar.jpg";

const muta = new Muta({
	chainId: "0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036",
	endpoint: "http://47.56.237.128:4321/graphql"
});
const client = muta.client();

$("#nav-login-button").click(function (event) {
	event.preventDefault();
	$("#login-panel").show();
});

function update_user_info() {
	$.ajax("users").then(function (data) {
		console.log(data);
		if(data.error == 0) {
			var user = data.data;
			$("#nav-user-info").show();
			$("#nav-login-button").hide();
			$("#avatar").src = user.avatar;
			$("#info #avatar").src = user.avatar;
			$("#tokens").text(user.n_tokens);
			$("#user-id").text(user.name);
			$("#info #name").text(user.name);
			$("#info #muta-amount").text(user.n_tokens);
			$("#info #tokens").text(user.n_tokens);
			$("#info #muta-address").text(user.muta_address);
			$("#info #ckb-address").text(user.ckb_address);
		} else if(user.error == 1) {
			$("#nav-user-info").hide();
			$("#nav-login-button").show();
		}
	});
}

function update_new_posts() {
	$.ajax("posts").then(function (posts) {
		if(posts.error == 0) {
			var post_list = $("#posts");
			post_list.html("");
			var template = $("#post-content-template").text();
			posts.data.forEach((post, index) => {
				post.thumbup_image = thumbup_image;
				post.comment_image = comment_image;
				post.m_image = m_image;
				post.image = avatar_image;
				var output = Mustache.render(template, post);
				post_list.append(output);
				$("#post-" + post.id + " .post-tokens").click(event => {
					event.preventDefault();
					$("#post-" + post.id + " .invest-token-modal").toggle();
				})
				$("#post-" + post.id + " .invest-token-submit").click(event => {
					event.preventDefault();
					var amount = parseInt($("#post-" + post.id + " .invest-token-amount").val());
					var secret_key = $("#post-" + post.id + " .invest-token-secret").val();
					console.log("Sending " + amount + " Muli to " + post.author);
					console.log("Secrete key is " + secret_key);
						var account = Account.fromPrivateKey(secret_key);
						var amount_hex = amount.toString(16);
						if(amount_hex.length % 2 == 1) {
							amount_hex = "0" + amount_hex;
						}
						var tx = $.get("create-transaction", {
							method: 'star',
							payload: JSON.stringify({
								post_id: post.id,
								balance: amount
							})
						}, (data) => {
							console.log(data);
							if(data.error == 0) {
								tx = data.data;
								console.log(tx);
								tx = account.signTransaction(tx);
								console.log(tx);
								var request = {
									transaction: JSON.stringify(tx),
									post_id: post.id,
									amount: amount,
									author: post.author
								};
								console.log(request);
								$.post("star", request, (data) => {
									if(data.error != 0) {
										console.log(data.msg);
									} else {
										window.location.reload();
									}
								});
							}
						});
				})
			})
		}
	});
}

update_user_info();
update_new_posts();

$("#cancel-button").click(function (event) {
	event.preventDefault();
	$("#login-panel").hide();
});

$(".login-button").click(function (event) {
	event.preventDefault();
	$.ajax("login-request").then(function (challenge) {
		console.log(challenge);
		var account = Account.fromPrivateKey($(".secret-key").val());
		console.log(account);
		console.log(account.address.toString());
		var tx = account.signTransaction({
			chainId: '0x0000000000000000000000000000000000000000000000000000000000000000',
			cyclesLimit: '0x00',
			cyclesPrice: '0x00',
			method: 'method',
			nonce: '0x0000000000000000000000000000000000000000000000000000000000000000',
			payload: challenge.challenge,
			serviceName: 'service_name',
			timeout: '0x9999'
		});
		console.log(tx);
		$.post("login", {
				user_id: $(".user-id").val(),
				signature: tx.signature,
				address: account.address.toString()},
			function (data) {
				console.log(data);
				$("#login-panel").hide();
				update_user_info();
			});
	})
})

$("#create-post").click(function(event) {
	event.preventDefault();
});

$("#submit-post").click(function(event) {
	event.preventDefault();
	var title = $(".create-post-title").val();
	var content = $(".create-post-content").val();
	if(title.length == 0) {
		alert("Title cannot be empty!");
		return;
	}
	if(content.length == 0) {
		alert("Content cannot be empty!");
		return;
	}
	var secret_key = $("#confirm-submit-post-secret-key").val();
	var account = Account.fromPrivateKey(secret_key);
	var tx = $.get("create-transaction", {
		method: 'create_post',
		payload: ''
	}, (data) => {
		console.log(data);
		if(data.error == 0) {
			tx = data.data;
			console.log(tx);
			tx = account.signTransaction(tx);
			console.log(tx);
			var request = {
				title: title,
				content: content,
				transaction: JSON.stringify(tx),
				address: account.address.toString(),
				image: "#",
				date: new Date().toISOString().slice(0, 10)
			};
			console.log(request);
			$.post("submit-post", request, (data) => {
				if(data.error == 0) {
					window.location.replace("/");
				} else {
					console.log(data.msg);
				}
			});
		}
	});

});

$("#confirm-cash-in").hide();
$("#confirm-cash-out").hide();

$("#cash-in-udt").keyup(event => {
	$("#cash-in-muli").val($("#cash-in-udt").val());
});

$("#cash-out-muli").keyup(event => {
	$("#cash-out-udt").val($("#cash-out-muli").val());
});

$("#cash-in-muli").keyup(event => {
	$("#cash-in-udt").val($("#cash-in-muli").val());
});

$("#cash-out-udt").keyup(event => {
	$("#cash-out-muli").val($("#cash-out-udt").val());
});

$("#cash-in-button").click((event) => {
	event.preventDefault();
	$("#confirm-cash-in").toggle();
	$("#confirm-cash-in-amount").text("UDT -" + (parseFloat($("#cash-in-udt").val())));
});

$("#cash-out-button").click((event) => {
	event.preventDefault();
	$("#confirm-cash-out").toggle();
	$("#confirm-cash-out-amount").text("UDT +" + (parseFloat($("#cash-out-muli").val())));
});

$("#stake-in-button").click((event) => {
	event.preventDefault();
	$("#confirm-stake-in").toggle();
	$("#confirm-stake-in-amount").text("UDT -" + (parseFloat($("#stake-in-udt").val())));
});

$("#stake-out-button").click((event) => {
	event.preventDefault();
	$("#confirm-stake-out").toggle();
	$("#confirm-stake-out-amount").text("UDT +" + (parseFloat($("#stake-out-udt").val())));
});

$("#confirm-cash-in-button").click(event => {
	event.preventDefault();
	var amount = parseFloat($("#cash-in-udt").val());
	var secret_key = $("#confirm-cash-in-secret-key").val();
	console.log("Amount: " + amount + " Secret Key: " + secret_key);
	$.post("cash-in", {
		amount: amount,
		secret_key: secret_key
	}, function(data) {
		location.reload();
		console.log(data);
	});
})

$("#confirm-cash-out-button").click(event => {
	event.preventDefault();
	var amount = parseFloat($("#cash-out-muli").val());
	var secret_key = $("#confirm-cash-out-secret-key").val();
	console.log("Amount: " + amount + " Secret Key: " + secret_key);
	$.post("cash-out", {
		amount: amount,
		secret_key: secret_key
	}, function(data) {
		location.reload();
		console.log(data);
	});
})

$("#confirm-stake-in-button").click(event => {
	event.preventDefault();
	var amount = parseFloat($("#stake-in-udt").val());
	var secret_key = $("#confirm-stake-in-secret-key").val();
	console.log("Amount: " + amount + " Secret Key: " + secret_key);
	$.post("stake-in", {
		amount: amount,
		secret_key: secret_key
	}, function(data) {
		console.log(data);
	});
})

$("#confirm-stake-out-button").click(event => {
	event.preventDefault();
	var amount = parseFloat($("#stake-out-udt").val());
	var secret_key = $("#confirm-stake-out-secret-key").val();
	console.log("Amount: " + amount + " Secret Key: " + secret_key);
	$.post("stake-out", {
		amount: amount,
		secret_key: secret_key
	}, function(data) {
		console.log(data);
	});
})
