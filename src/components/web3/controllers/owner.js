import { getContractOwnerAddress, getContractOwnerPassword } from '../contracts/owner';

let module = null;
let isOwnerAccountLocked = true;
const waitForUnlockRequests = [];
let transactionsAmount = 0;

export default class OwnerController {

    constructor(baseModule) {
        module = baseModule;
    }

    unlockOwnerAccount(time = 10) {
        return module.eth.personal.unlockAccount(
            getContractOwnerAddress(),
            getContractOwnerPassword(),
            time
        );
    }

    lockOwnerAccount() {
        return module.eth.personal.lockAccount(getContractOwnerAddress());
    }

    addToOwnerTransactionsList(controller, method, params) {
        waitForUnlockRequests.push({ params, controller, method });
        this.executeOwnerTransactions();
    }

    async executeOwnerTransactions() {

        if (isOwnerAccountLocked && waitForUnlockRequests.length) {
            isOwnerAccountLocked = false;

            isOwnerAccountLocked = await this.unlockOwnerAccount(500)
                .then((isAccountUnlocked) => {
                    return !isAccountUnlocked;
                }).catch((e) => {
                    console.log(e);
                });

            for (let i = 0; i < 100; i++ ) {
                if (i < waitForUnlockRequests.length) {
                    transactionsAmount++;
                    const { params, controller, method } = waitForUnlockRequests.shift();
                    controller[method](params);
                } else {
                    break;
                }
            }
        }
    }

    async onExecutedOwnerTransaction() {
        if (--transactionsAmount === 0) {
            isOwnerAccountLocked = await this.lockOwnerAccount()
                .then((isAccountLocked) => {
                    return isAccountLocked;
                });

            this.executeOwnerTransactions();
        }
    }

    get waitForUnlockRequests() {
        return waitForUnlockRequests;
    }
}



/*



 get isOwnerAccountLocked() {
        return isOwnerAccountLocked;
    }

    set isOwnerAccountLocked(isLocked) {
        isOwnerAccountLocked = isLocked;
    }


 */