const ethers = require("ethers");

const keccak256 = require('keccak256');

const terminal = document.querySelector(".terminal");
const hydra = document.querySelector(".hydra");
const rebootSuccessText = document.querySelector(".hydra_reboot_success");
const maxCharacters = 24;
const unloadedCharacter = ".";
const loadedCharacter = "#";
const spinnerFrames = ["/", "-", "\\", "|"];

const ethersObject = {};
const { MerkleTree } = require('merkletreejs')


const  { Web3Modal } = require("web3modal");
const { WalletConnectProvider } = require('@walletconnect/web3-provider')

let whitelistObject;
let merkleTree;

// Config
const { 

	yugenABI,
	yugenAddress,
	testYugenABI,
	testYugenAddress
	
}  = require('../values/config');

if ($('body').hasClass('no-scroll')) {
	const terminal = document.querySelector(".terminal");
	const hydra = document.querySelector(".hydra");
	const rebootSuccessText = document.querySelector(".hydra_reboot_success");
	const maxCharacters = 24;
	const unloadedCharacter = ".";
	const loadedCharacter = "#";
	const spinnerFrames = ["/", "-", "\\", "|"];

	// Clone the element and give the glitch classes
	(glitchElement => {
		const glitch = glitchElement.cloneNode(true);
		const glitchReverse = glitchElement.cloneNode(true);
		glitch.classList.add("glitch--clone", "glitch--bottom");
		glitchReverse.classList.add("glitch--clone", "glitch--top");
		glitch.setAttribute("aria-hidden", "true");
		glitchReverse.setAttribute("aria-hidden", "true");

		glitchElement.insertAdjacentElement("afterend", glitch);
		glitchElement.insertAdjacentElement("afterend", glitchReverse);
	})(terminal);

	// Get all the loading bars
	const loadingBars = document.querySelectorAll(".loading-bar");
	const processAmounts = document.querySelectorAll(".process-amount");
	const spinners = document.querySelectorAll(".spinner");
	const rebootingText = document.querySelectorAll(".hydra_rebooting");
	const glitches = document.querySelectorAll(".glitch--clone");

	// Helper for random number
	const RandomNumber = (min, max) => Math.floor(Math.random() * max) + min;

	const Delay = (time) => {
		return new Promise((resolve) => setTimeout(resolve, time))
	};

	const HideAll = elements =>
		elements.forEach(glitchGroup =>
			glitchGroup.forEach(element => element.classList.add("hidden"))	);

	const ShowAll = elements =>
		elements.forEach(glitchGroup =>
			glitchGroup.forEach(element => element.classList.remove("hidden")) );

	// Render the bar to HTML
	const RenderBar = ( values ) => {
		const currentLoaded = values.lastIndexOf(loadedCharacter) + 1;
		const loaded = values.slice(0, currentLoaded).join("");
		const unloaded = values.slice(currentLoaded).join("");

		// Update all the loading bars
		loadingBars.forEach(loadingBar => {
			loadingBar.innerHTML = `(${loaded}<span class="loading-bar--unloaded">${unloaded}</span>)`;
		});

		// Update all the percentages
		loadingPercent = Math.floor(currentLoaded / maxCharacters * 100);
		processAmounts.forEach(processAmount => {
			processAmount.innerText = loadingPercent;
		});
	};

	// Update the loaded value and render it to HTML
	const DrawLoadingBar = ( values ) => {
		return new Promise((resolve) => {
				const loadingBarAnimation = setInterval(() => {
					if (!values.includes(unloadedCharacter)) {
						clearInterval(loadingBarAnimation);
						resolve();
					}

					values.pop(unloadedCharacter);
					values.unshift(loadedCharacter);
					RenderBar(values);
			}, RandomNumber(50, 70));
		});
	};

	const DrawSpinner = (spinnerFrame = 0) => {
		return setInterval(() => {
			spinnerFrame += 1;
			spinners.forEach(
				spinner =>
					(spinner.innerText = `[${
						spinnerFrames[spinnerFrame % spinnerFrames.length]
					}]`)
			);
		}, RandomNumber(50, 70));
	};

	const AnimateBox = () => {
		const first = hydra.getBoundingClientRect();
		HideAll([spinners, glitches, rebootingText]);
		rebootSuccessText.classList.remove("hidden");
		rebootSuccessText.style.visibility = "hidden";
		const last = hydra.getBoundingClientRect();

		const hydraAnimation = hydra.animate([
			{ transform: `scale(${first.width / last.width}, ${first.height / last.height})` },
			{ transform: `scale(${first.width / last.width}, 1.2)` },
			{ transform: `none` }
		],{
			duration: 100,
			easing: 'cubic-bezier(0,0,0.32,1)',
		});	

		hydraAnimation.addEventListener('finish', () => {
			rebootSuccessText.removeAttribute("style");
			hydra.removeAttribute("style");
		});
	};

	const PlayHydra = async() => {
		terminal.classList.add("glitch");
		rebootSuccessText.classList.add("hidden");
		ShowAll([spinners, glitches, rebootingText]);
		const loadingBar = new Array(maxCharacters).fill(unloadedCharacter);
		const spinnerInterval = DrawSpinner();

		// Play the loading bar
		await DrawLoadingBar(loadingBar);
		
		// Loading is complete on the next frame, hide spinner and glitch
		requestAnimationFrame(()=> {
			clearInterval(spinnerInterval);
			terminal.classList.remove("glitch");
			AnimateBox();
		});
	};

	PlayHydra();

}

const getProviderOptions = () => ({
	walletconnect: {
	  package: WalletConnectProvider, // required
	  options: {
		infuraId: process.env.REACT_APP_INFURA_ID, // required
	  },
	},
});

const initialState = {
	provider: null,
	web3Provider: null,
	address: null,
	chainId: null,
	maxAmount: 0,
}

let state = initialState;

const connect = async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await Web3Modal.connect()

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    const network = await web3Provider.getNetwork()

    const ethersProvider = new ethers.providers.Web3Provider(provider)
    const ethersSigner = ethersProvider.getSigner();

    let yugenContract;

    if (process.env.ENVIRONMENT === 'testnet') {
		yugenContract = new ethers.Contract(testYugenAddress, testYugenABI, ethersSigner);
    } else {
      yugenContract = new ethers.Contract(yugenAddress, yugenABI, ethersSigner);
    }

	//todo set the button to disconnect

	state = {
		provider,
		web3Provider,
		address,
		chainId: network.chainId,
		yugenContract: yugenContract,
		proofs: getAllProofs(address)
    }


}

const getPrice = function(type) {

	if(type == 0) {
		return ethers.parseEther("0.06");
	}
	if(type == 1) {
		return ethers.parseEther("0.04");
	}

	return 0;

}

const mint = async function(amount, type) {

	let proofObject = state.proofs[type];

	// let amount = $('.mintAmount').value;

	let price = getPrice(type);

	if(price == 0) {
		await yugenContract.whitelistMint(proofObject.proof, amount, type, proofObject.maxAmount);
	} else {

		await yugenContract.whitelistMint(proofObject.proof, amount, type, proofObject.maxAmount, {value : price.mul(amount)});

	}

	//TODO: set the text

}

const setText = function(text1, text2) {

	if(text1 == "" && text2 == "") {

		$('.mint-form__text').style.visibility = "hidden";
		


	} else {
		$('.mint-form__text').style.visibility = "visible";
	}

	$('.mint-form_text_left').textContent = text1;
	$('.mint-form_text_right').textContent = text2;

}

const disconnect = async function () {
	await web3Modal.clearCachedProvider()
	if (provider?.disconnect && typeof provider.disconnect === 'function') {
		await provider.disconnect()
	}
	state = initialState

	setButton(false)
}


const setButton = function(newState) {

	if(newState) {
		//no on so lets set disconnect
		$('.mint-form__button').textContent = "Disconnect";
		$('.mint-form__button').on("click",function(){
			disconnect()
			setButton(false)
		});

	} else {

		$('.mint-form__button').textContent = "Connect";
		$('.mint-form__button').on("click",function(){
			connect();
			setButton(true)
		});

	}

}

// const subscribeProvider = async function(provider) {
//     if (!provider.on) {
//       return;
//     }
//     provider.on("close", () => this.resetApp());
//     provider.on("accountsChanged", async (accounts: string[]) => {
//       await this.setState({ address: accounts[0] });
//       await this.getAccountAssets();
//     });
//     provider.on("chainChanged", async (chainId: number) => {
//       const { web3 } = this.state;
//       const networkId = await web3.eth.net.getId();
//       await this.setState({ chainId, networkId });
//       await this.getAccountAssets();
//     });

//     provider.on("networkChanged", async (networkId: number) => {
//       const { web3 } = this.state;
//       const chainId = await web3.eth.chainId();
//       await this.setState({ chainId, networkId });
//       await this.getAccountAssets();
//     });
//   };

function getHexProof(address, type) {

	if(address in whitelistObject == false || type in whitelistObject[address] == false) {
		console.log("no proof");
		return false;
	}

	const amount = whitelistObject[address][type];

	const hashedLeaf = keccak256(ethers.utils.solidityPack(["address", "uint256", "uint256"], [address, type, amount]));

	
	return {"proof" : merkleTree.getHexProof(hashedLeaf), "maxAmount" : amount };

}

function getAllProofs(address) {

	let result = {}

	for(let i = 0; i < 3; i++) {

		result[i] = getHexProof(address, i);
	}

	return result;

}

async function generateMerkleTree(test = []) {

    const whitelistObject = require("../values/whitelist.json");

    let leafArray = []

    for(i in test) {

        const testAddress = test[i];

        whitelistObject[testAddress] = {0 : 1, 1 : 2, 2 : 2}

    }

    const addresses = Object.keys(whitelistObject);

    for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];

        const addressObject = whitelistObject[address];

        for(let j = 0; j < 3; j++) {

            if(j in addressObject) {

                let obj = {"address" : address, "type" : j, "maxAmount" : addressObject[j]}
                
                leafArray.push(obj)

            }

        }

    }

    const leafNodes = leafArray.map(leaf => {

        let hash = keccak256(ethers.utils.solidityPack(["address", "uint256", "uint256"], [leaf.address, leaf.type, leaf.maxAmount]));
        
        return hash;
        
    });

    merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});

    const merkleTreeRoot = await merkleTree.getHexRoot();

    console.log("hexroot: ", merkleTreeRoot);

    return {merkleTree, whitelistObject};

}

const changeMintAmount = function(increment) {

	let value = $('.mintAmount').value;

	if(increment) {

		if(value + 1 <= state.maxAmount) {
			$('.mintAmount').value = value + 1;
		}
	} else {

		if(value - 1 >= 0) {
			$('.mintAmount').value = value - 1;
		}

	}

}

$('document').ready(function(){

	setTimeout(() => {
		$('.preloader').fadeOut();
		$('body').removeClass('no-scroll');
	}, 4000);
	
	$('.go_to').click( function(){
		var scroll_el = $(this).attr('href');
		if ($(scroll_el).length != 0) {
			$('html, body').animate({ scrollTop: $(scroll_el).offset().top - 0 }, 800);
		}
    return false;
	});

	setButton(false);

	const generation = generateMerkleTree();

	merkleTree = generation.merkleTree;
	whitelistObject = generation.whitelistObject;

	$('.mintAmount').addEventListener('change', function(){
		let value = $('.mintAmount').value;

		if(value > state.maxAmount) {
			$('.mintAmount').value = state.maxAmount;
		} else if(value < 0) {
			$('.mintAmount').value = state.maxAmount;
		}
	});

	$('.strategy-slider').slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,
		autoplay: false,
		dots: false,
		fade: true,
		cssEase: 'linear'
	});

	$('.strategy-images').slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,
		autoplay: false,
		dots: false,
		fade: true,
		cssEase: 'linear'
	});

	$(".strategy-dot").on("click",function(){
		$(this).hasClass("active")||($(".strategy-dot").removeClass("active"),
		$(this).addClass("active"),
		$(".strategy-slider").slick("slickGoTo",$(this).index()),
		$(".strategy-images").slick("slickGoTo",$(this).index())
		)
	});

	$(".mint-form__minus").on("click",function() {

		changeMintAmount(false);

	})

	$(".mint-form__plus").on("click",function() {

		changeMintAmount(true);

	})

	$('.team-slider').slick({
		slidesToShow: 4,
		slidesToScroll: 1,
		arrows: true,
		autoplay: false,
		dots: false,
	    prevArrow: '.team-prev',		
		nextArrow: '.team-next',
		responsive: [{
			breakpoint: 768,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				infinite: true,
				dots: true,
				autoplay: false,
			}
		}]
	});

	$('.menu-toggle').click(function(){
		$('.header-menu').toggleClass('active');
		$('.menu-toggle').toggleClass('active');
	});
	
	if($(window).width() < 768){
		$('.go_to').click( function(){
			$('.menu-toggle').removeClass('active');
			$('.header-menu').removeClass('active');
		});
	};

	$('.faq-item').click(function(){
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
		} else {
			$(this).parents('.faq-list').find('.faq-item').removeClass('active');
			$(this).addClass('active');
		};
	});

	const minusButton = $('.mint-form__minus');
	const plusButton = $('.mint-form__plus');
	const count = $('.mint-form__count input');

	plusButton.click(function(){
		let countValue = count.val();
		count.val(+countValue + 1);
	});

	minusButton.click(function(){
		let countValue = count.val();
		if (countValue > 0) {
			count.val(+countValue - 1);
		}
		
	});
});
