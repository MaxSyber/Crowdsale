const { expect } = require('chai');
const { recoverAddress } = require('ethers/lib/utils');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Crowdsale', () => {
    let crowdsale

    beforeEach(async () => {
        const Crowdsale = await ethers.getContractFactory('Crowdsale')
        crowdsale = await Crowdsale.deploy()
    })

    describe('Deployment', () => {
        it('Has a Name', async () => {            
            expect(await crowdsale.name()).to.equal('Crowdsale')
        })
    })
})
