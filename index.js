import TonWeb from "tonweb"
import config from "./config.js"
import checkLinks from "./functions/checkLinks.js";
import shortAddress from "./utils/shortAddress.js";
import {createPost, pinMessage} from "./functions/telegram.js";

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
    apiKey: config.toncenterKey
}))

async function listen() {
    const storage = new TonWeb.InMemoryBlockStorage((data) => {
        // console.log(data)
    });

    const onBlock = async (blockHeader) => {
        try {
            const workchain = blockHeader.id.workchain;
            const shardId = blockHeader.id.shard;
            const blockNumber = blockHeader.id.seqno;
            if (Number(workchain) == 0) {
                const blockTransactions = await tonweb.provider.getBlockTransactions(workchain, shardId, blockNumber);
                const shortTransactions = blockTransactions.transactions;
                for (const shortTx of shortTransactions) {
                    const transactions = await tonweb.provider.getTransactions(shortTx.account, 1, shortTx.lt, shortTx.hash);
                    const tx = transactions[0];

                    const amount = tx.in_msg.value / Math.pow(10, 9)

                    if (tx.in_msg.destination == config.wallet.address && amount >= 1 && tx.in_msg.message.length > 1) {
                        let checkForLinks = checkLinks(tx.in_msg.message);
                        let postData = {
                            "pin": false,
                            "links": false,
                            "notify": false,
                            "emoji": ""
                        }

                        if (amount >= 10) {
                            postData.links = true
                            postData.notify = true
                            postData.emoji = '🔥 '
                        }
                        if (amount >= 100) {
                            postData.pin = true
                            postData.emoji = '💎 '
                        }
                        
                        if (!postData.links && checkForLinks) {
                            // чел тупой, не прочитал правила
                        } else {
                            let message = `Сообщение от <a href="https://tonscan.org/address/${tx.in_msg.source}">${shortAddress(tx.in_msg.source)}</a> <b>(${amount} 💎)</b>:

${postData.emoji}${tx.in_msg.message}`;
                            let post = await createPost(message, postData.notify);
                            console.log(post)
                            
                            if (postData.pin) {
                                await pinMessage(post.message_id)
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`Err: ${e}`)
        }
    }

    const blockSubscribe = new TonWeb.BlockSubscription(tonweb.provider, storage, onBlock);
    await blockSubscribe.start();
}

listen()