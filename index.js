require('dotenv').config()
const moment = require('moment-timezone')
const minute = moment().tz("America/Caracas").format('mm')
const axios = require('axios')
const cron = require('node-cron');

//const chatId = 912529934
const message_hourli_report = `
\xF0\x9F\x9A\x80 Avance

\xE2\x9C\x8C Estado de la pool:
* -Hash Rate: #currentHashrate Mh/s
* -\xF0\x9F\x8E\x89 Saldo: #unpaid RVN
* -Saldo por confirmar: #unconfirmed RVN
* -Saldo estimado: #estimated RVN

Estado de la wallet \xF0\x9F\x92\xBC:
* -\xE2\xAD\x90 Saldo: #walletBalance RVN
* -Total Recibido: #walletRecive RVN
* -Total Enviado: #walletSend RVN

El sigueinte es un reporte del progreso de la mina en la ultima hora \xE2\x8F\xB3:
* -Saldo: #lastHourUnpaid RVN
* -Saldo sin confirmar: #lastHourUnconfirmed RVN
* -Saldo Estimado: #lastHourEstimated RVN
`

const message_work_day = `
\xE2\x9C\xA8 Final de un dia de trabajo \xE2\x9C\xA8
Dias en total: #day #dayLabel
`
let unpaidBalance = 0
let unconfirmedBalance =0
let workDays = 1
const sendHourInfoMessage = async () => {
    try {
            let pool = await axios.get(`https://api-ravencoin.flypool.org/miner/${process.env.WALLET}/dashboard`)
            pool = pool.data.data
            let getWallet = await axios.get(`https://ravencoin.network/api/addr/${process.env.WALLET}/?noTxList=1`)
            getWallet = getWallet.data
            const balance = getWallet.balance
            const totalReceived= getWallet.totalReceived
            const totalSent= getWallet.totalSent
            let currentHashrate =  pool.currentStatistics.currentHashrate / 1000000
            let currentUnpaid = pool.currentStatistics.unpaid / 100000000
            let currentUnconfirmedBalance = pool.currentStatistics.unconfirmed / 100000000
            let currentEstimatedBalance = (currentUnpaid + currentUnconfirmedBalance).toFixed(2)
            
            let unpaidLastHour = Math.abs(currentUnpaid - unpaidBalance)  ;
            let uncomfirmedBalanceLastHour =  Math.abs((currentUnconfirmedBalance - unconfirmedBalance))
            let estimatedBalanceLastHour = unpaidLastHour + uncomfirmedBalanceLastHour

            
            let message = message_hourli_report.replace(/#unpaid/igm, currentUnpaid.toFixed(2))
            message = message.replace(/#unconfirmed/igm, currentUnconfirmedBalance.toFixed(2))
            message = message.replace(/#currentHashrate/igm, currentHashrate.toFixed(2))
            message = message.replace(/#estimated/igm, currentEstimatedBalance)

            message = message.replace(/#walletBalance/igm, balance)
            message = message.replace(/#walletRecive/igm, totalReceived)
            message = message.replace(/#walletSend/igm, totalSent)

            message = message.replace(/#lastHourUnpaid/igm, unpaidLastHour.toFixed(2))
            message = message.replace(/#lastHourUnconfirmed/igm, uncomfirmedBalanceLastHour.toFixed(2))
            message = message.replace(/#lastHourEstimated/igm, estimatedBalanceLastHour.toFixed(2))
            await axios.get(`https://api.telegram.org/bot${process.env.KEY}/sendMessage?chat_id=${process.env.CHATID}&parse_mode=Markdown&text=${message}`)
            unpaidBalance = currentUnpaid
            unconfirmedBalance = currentUnconfirmedBalance
    } catch (err) {
        console.log("err")
    }
};

const sendDayWorkMessage = ()=>{
    try{
        let dayLabel = workDays<2?"dia":"dias"
        let message = message_work_day.replace(/#dayLabel/img, dayLabel)
        message = message.replace(/#day/img, workDays)
        axios.get(`https://api.telegram.org/bot${process.env.KEY}/sendMessage?chat_id=${process.env.CHATID}&parse_mode=Markdown&text=${message}`)
    }
    catch(err){
        console.log(err)
    }
    
}


const init = cron.schedule('0 * * * *', () =>  {
    sendHourInfoMessage()
}, {
    scheduled: false
});

cron.schedule('27 10 * * *', () => {
    sendDayWorkMessage()
});

const loop = ()=>{

    if(minute==0){
        init.start()
    } else {
        setTimeout(()=>{
            loop()
        },1000);
    }
    
}

loop()