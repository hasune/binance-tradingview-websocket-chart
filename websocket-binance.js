// 트레이딩뷰 차트
const chart = LightweightCharts.createChart(document.body, {

	width: 700,
    height: 600,
    layout: {
        backgroundColor: '#000000',
        textColor: '#ffffff',
    },

    grid: {
        vertLines: {
            color: '#404040',
        },
        horzLines: {
            color: '#404040',
        },
    },

	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},

    priceScale: {
        borderColor: '#cccccc',
    },

    timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
    },
});


// 현재의 바 오브젝트
let currentBar = {};
// 이 배열에 트레이드된 가격을 계속 넣는다.
let tradePrice = [];

const candleSeries = chart.addCandlestickSeries();

// let start = new Date(Date.now() - (7200 * 1000)).toISOString(); // .toISOString() 현재일시를 utc로 취득
// alpaca의 경우에는 계산된 start날짜값을 uri파라미터로 캔들의 개수값을 지정 / 바이낸스도 마찬가지이지만 바이낸스는 계산 불필요
const binance_chart_data_url = 'https://fapi.binance.com/fapi/v1/klines?symbol=ETHUSDT&interval=1m'
const BINANCE_API_KEY = 'dbefbc809e3e83c283a984c3a1459732ea7db1360ca80c5c2c8867408d28cc83';
const BINANCE_SECRET_KEY = '2b5eb11e18796d12d88f13dc27dbbd02c2cc51ff7059765ed9821957d82bb4d9';

fetch(binance_chart_data_url, {
    headers: {
        'apiKey': BINANCE_API_KEY,
        'secretKey': BINANCE_SECRET_KEY 
    }
}).then((res) => res.json())
.then((response) => {
    // console.log(response);
    /* 페이로드
    [
        [
            1499040000000,      // Open time   0번째
            "0.01634790",       // Open        1번째
            "0.80000000",       // High        2번째 
            "0.01575800",       // Low         3번째
            "0.01577100",       // Close       4번째
            "148976.11427815",  // Volume      5번째
            1499644799999,      // Close time  6번째
            "2434.19055334",    // Quote asset volume
            308,                // Number of trades
            "1756.87402397",    // Taker buy base asset volume
            "28.46694368",      // Taker buy quote asset volume
            "17928899.62484339" // Ignore.
        ]
    ]
    */
    // 캔들을 open time 기준으로 해야함. close time 으로 하면 라이브러리에서 에러.
    const data = response.map(res => (
        {
            open: Number(res[1]),
            high: Number(res[2]),
            low: Number(res[3]),
            close: Number(res[4]),
            time: timeToLocal(Date.parse(new Date(res[0])) / 1000)   
        }

    ));
    // console.log(data)

    // // 현재 캔들은 총 캔들 길이에서 하나를 뺀것.
    currentBar = data[data.length - 1];

    // console.log(data);
    candleSeries.setData(data);
})

//////////////////////////////////////////////////////////////////////////////////////////


// 테스트넷
const testnet_url = "wss://testnet-dex.binance.org/api/ws";
// 혼방
const url = "wss://dex.binance.org/api/ws";


/*
  공홈 : 여기에서 보면 된다 !!
  https://binance-docs.github.io/apidocs/futures/en/#websocket-market-streams
*/

// aggTrade만 받을 경우
// const binanceSocket = new WebSocket("wss://fstream.binance.com/ws/ethusdt@aggTrade");
// markPrice만 받을 경우
// const binanceSocket = new WebSocket("wss://fstream.binance.com/ws/ethusdt@markPrice@1s");

// stream?streams= 스타일로 작성해서 2개를 동시에 받을 경우
// const binanceSocket = new WebSocket("wss://fstream.binance.com/stream?streams=ethusdt@aggTrade/ethusdt@markPrice@1s");
// console.log(binanceSocket)

// stream?streams= 스타일로 작성해서 3개를 동시에 받을 경우
const binanceSocket = new WebSocket("wss://fstream.binance.com/stream?streams=ethusdt@aggTrade/ethusdt@markPrice@1s/ethusdt@kline_1m");


const aggregateTradeElement = document.getElementById('aggregate_trade_data');
const markPriceElement = document.getElementById('mark_price');

binanceSocket.onmessage = function(event) {
    // 어떤 데이터가 오는지 확인한다
    // console.log(event.data);
    
    
    /*
    이벤트 데이터의 내용은 이러하다
    #########################################
    단순하게 하나만 받을때
    #########################################
    wss://fstream.binance.com/ws/ethusdt@aggTrade
    {"e":"aggTrade","E":1649968872708,"a":806504986,"s":"ETHUSDT","p":"3009.67","q":"0.012","f":1569157562,"l":1569157562,"T":1649968872685,"m":false}
    
    공홈 페이로드
    {
        "e": "aggTrade",  // Event type
        "E": 123456789,   // Event time
        "s": "BTCUSDT",    // Symbol
        "a": 5933014,     // Aggregate trade ID
        "p": "0.001",     // Price
        "q": "100",       // Quantity
        "f": 100,         // First trade ID
        "l": 105,         // Last trade ID
        "T": 123456785,   // Trade time
        "m": true,        // Is the buyer the market maker?
    }



    #########################################
    aggregateTradeData / markPrice 두개 동시에 받을 때
    #########################################
    wss://fstream.binance.com/stream?streams=ethusdt@aggTrade/ethusdt@markPrice@1s
    markPrice같은 경우는 @1s 를 안해주면 3초에 한번씩 받아온다. 공홈에 나와있다. 1s or 3s 라고
    
    {"stream":"ethusdt@aggTrade","data":{"e":"aggTrade","E":1649970924237,"a":806517792,"s":"ETHUSDT","p":"3010.79","q":"16.304","f":1569193319,"l":1569193340,"T":1649970924081,"m":true}}
    
    {"stream":"ethusdt@markPrice","data":{"e":"markPriceUpdate","E":1649971083000,"s":"ETHUSDT","p":"3013.04000000","P":"3015.01274823","i":"3014.74946032","r":"-0.00002507","T":1649980800000}}
    
    공홈 페이로드
    {
        "e": "markPriceUpdate",     // Event type
        "E": 1562305380000,         // Event time
        "s": "BTCUSDT",             // Symbol
        "p": "11794.15000000",      // Mark price
        "i": "11784.62659091",      // Index price
        "P": "11784.25641265",      // Estimated Settle Price, only useful in the last hour before the settlement starts
        "r": "0.00038167",          // Funding rate
        "T": 1562306400000          // Next funding time
    }
    

    추가!!  캔들 데이터
    {"stream":"ethusdt@kline_1m","data":{"e":"kline","E":1649976128355,"s":"ETHUSDT","k":{"t":1649976120000,"T":1649976179999,"s":"ETHUSDT","i":"1m","f":1569264624,"L":1569264712,"o":"3013.09","c":"3013.31","h":"3013.32","l":"3013.08","v":"24.994","n":89,"x":false,"q":"75309.20136","V":"10.545","Q":"31773.03870","B":"0"}}}

    페이로드
    {
        "e": "kline",     // Event type
        "E": 1638747660000,   // Event time
        "s": "BTCUSDT",    // Symbol
        "k": {
            "t": 1638747660000, // Kline start time
            "T": 1638747719999, // Kline close time
            "s": "BTCUSDT",  // Symbol
            "i": "1m",      // Interval
            "f": 100,       // First trade ID
            "L": 200,       // Last trade ID
            "o": "0.0010",  // Open price
            "c": "0.0020",  // Close price
            "h": "0.0025",  // High price
            "l": "0.0015",  // Low price
            "v": "1000",    // Base asset volume
            "n": 100,       // Number of trades
            "x": false,     // Is this kline closed?
            "q": "1.0000",  // Quote asset volume
            "V": "500",     // Taker buy base asset volume
            "Q": "0.500",   // Taker buy quote asset volume
            "B": "123456"   // Ignore
           }
    }


    */

    // 데이터를 json 형식으로 파싱한다
    const data = JSON.parse(event.data);
    // console.log(data.data)

    if (data.data.e == "aggTrade") {

        let aggregateTradeData = data.data;
        const tradeElement = document.createElement('div');
        tradeElement.className = 'aggregate_trade_data';
        tradeElement.innerHTML = `${aggregateTradeData.s} <b>${new Date(aggregateTradeData.T).toTimeString().split(" ")[0]}</b> ${aggregateTradeData.p} ${aggregateTradeData.q}`;
        aggregateTradeElement.appendChild(tradeElement);

        let elements = document.getElementsByClassName('aggregate_trade_data');
        if (elements.length > 10) {
            aggregateTradeElement.removeChild(elements[0]);
        }

        // 웹 페이지의 타이틀에 종목과 가격표시(가격을 동적으로 변하게 한다)
        top.document.title = `${aggregateTradeData.s} ${aggregateTradeData.p}`

        tradePrice.push(aggregateTradeData.p);
        // tradePrice 배열에 계속 추가 되는것을 알 수 있다.
        // console.log(tradePrice) 
        
        let open = tradePrice[0];
        let high = Math.max(...tradePrice);
        let low = Math.min(...tradePrice);
        let close = tradePrice[tradePrice.length - 1];

        // console.log(`open : ${open}, high : ${high}, low : ${low}, close : ${close}`);

        // console.log(`currentBar.time check :${currentBar.time}`)
        // candleSeries.update({
        //     // time: currentBar.time + 60,
        //     time: currentBar.time,
        //     // time: aggregateTradeData.T,
        //     open: open,
        //     high: high,
        //     low: low,
        //     close: close

        // })
     
    } else if (data.data.e == "markPriceUpdate") {

        let markPriceData = data.data;
        let currentPrice = Number(markPriceData.p).toFixed(2);

        const tradeElement = document.createElement('div');
        tradeElement.className = 'mark_price';
        tradeElement.innerHTML = `${markPriceData.s} <b>${new Date(markPriceData.E).toTimeString().split(" ")[0]}</b> ${currentPrice}`;
        markPriceElement.appendChild(tradeElement);

        let elements = document.getElementsByClassName('mark_price');
        if (elements.length > 10) {
            markPriceElement.removeChild(elements[0]);
        }
    } else if (data.data.e == "kline") {

        let chartData = data.data;
        // console.log(`klineOpen : ${chartData.k.o} klineClose : ${chartData.k.c}`)


        // let timestamp = new Date(chartData.t).getTime() / 1000;
        let timestamp = timeToLocal(new Date(chartData.k.t).getTime() / 1000);
        // console.log(`chartData.t : ${chartData.t}`);
        // console.log(`timestamp : ${timestamp}`)

        // let openTime = chartData.t;
        // let closeTime = chartData.T;

        // let open = chartData.o;
        // let high = chartData.h;
        // let low = chartData.l;
        // let close = chartData.c;

        currentBar = {
            time: timestamp,
            open: chartData.k.o,
            high: chartData.k.h,
            low: chartData.k.l,
            close: chartData.k.c
        }
     
        candleSeries.update(currentBar);

    }
}


/*
    Time이 utc인데 lightweight 에서는 차트옵션으로 타임존 지정을 지원안한다.
    공홈을 보니 이런 메서드로 하라고 하네..
    https://github.com/tradingview/lightweight-charts/blob/v3.7.0/docs/time-zones.md

*/
// you could use this function to convert all your times to required time zone
function timeToTz(originalTime, timeZone) {
    const zonedDate = new Date(new Date(originalTime * 1000).toLocaleString('ko-KR', { timeZone }));
    return zonedDate.getTime() / 1000;
}

function timeToLocal(originalTime) {
    const d = new Date(originalTime * 1000);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;
}

