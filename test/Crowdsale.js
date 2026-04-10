const { expect } = require('chai');
const { recoverAddress } = require('ethers/lib/utils');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Crowdsale', () => {
    let crowdsale
    let token
    let accounts
    let deployer, user1, user2
    beforeEach(async () => {
        //load contracts
        const Crowdsale = await ethers.getContractFactory('Crowdsale')
        const Token = await ethers.getContractFactory('Token')

        //deploy token
        token = await Token.deploy('Dah', 'DAH', '1000000')

        //configure accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        user1 = accounts[1]
        user2 = accounts[2]

        //deploy crowdsale
        crowdsale = await Crowdsale.deploy(token.address, ether(1), '1000000')

        //send tokens to crowdsale
        let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens('1000000'))
        await transaction.wait()
    })

    describe('Deployment', () => {
        
        it('Sends Tokens to the Crowdsale Contract', async () => {            
            expect(await token.balanceOf(crowdsale.address)).to.equal(tokens('1000000'))
        }) 
        it('Returns the Price', async () => {            
            expect(await crowdsale.price()).to.equal(ether(1))
        }) 

        it('Returns Token Address', async () => {            
            expect(await crowdsale.token()).to.equal(token.address)
        })  
    })

    describe('Buying Tokens', () => {
        let amount = tokens(10)
        let transaction, result
        
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(10)})
                result = await transaction.wait()
            })

            it('Transfers Tokens', async () => {            
                expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999990))
                expect(await token.balanceOf(user1.address)).to.equal(amount)
            }) 
            
            it('Updates Contracts Ether Balance', async () => {            
                expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
            })

            it('Updates Tokens Sold', async () => {            
                expect(await crowdsale.tokensSold()).to.equal(amount)
            })

            it('Emits a Buy Event', async () => {            
                await expect(transaction).to.emit(crowdsale, 'Buy').withArgs(amount, user1.address)
            })
        })

        describe('Failure', () => {
            it('Reject Insufficient ETH', async () => {            
            await expect(crowdsale.connect(user1).buyTokens(tokens(10), {value: 0})).to.be.reverted
            }) 
        })
    })

    describe('Sending Eth', () => {
        let amount = tokens(10)
        let transaction, result
        
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await user1.sendTransaction({to: crowdsale.address, value: amount })
                result = await transaction.wait()
            })

            it('Updates Contracts Ether Balance', async () => {            
                expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
            })

            it('Updates User Token Balance', async () => {            
                expect(await token.balanceOf(user1.address)).to.equal(amount)
            })
        })
    })

    describe('Updating Price', () => {
        let transaction, result
        let price = ether(2)
        
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await crowdsale.connect(deployer).setPrice(price)
                result = await transaction.wait()

                transaction = await crowdsale.connect(deployer).finalize()
                result = await transaction.wait()
            })

            it('Updates the Price', async () => {            
                expect(await crowdsale.price()).to.equal(price)
            })
        })

        describe('Failure', () => {
            it('Prevents Non-Owner From Setting Price', async () => {            
            await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted
            }) 
        })
    })

    describe('Finalizing Sale', () => {
        let transaction, result
        let amount = tokens(10)
        let value = tokens(10)
        
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value})
                result = await transaction.wait()

                transaction = await crowdsale.connect(deployer).finalize()
                result = await transaction.wait()
            })

            it('Transfers Remaining Tokens to Owner', async () => {            
                expect(await token.balanceOf(crowdsale.address)).to.equal(0)
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
            })

            it('Transfers Eth Balance to Owner', async () => {            
                expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0)
            })

            it('Emits Finalize Event', async () => {            
                await expect(transaction).to.emit(crowdsale, "Finalize").withArgs(amount, value)
            })

        })

        describe('Failure', () => {
            it('Prevents Non-Owner From Finalizing', async () => {            
            await expect(crowdsale.connect(user1).finalize()).to.be.reverted
            }) 
        })
    })
})
