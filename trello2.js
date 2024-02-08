b = () => {
    x = a.lists.filter(x => x.closed == false);
    y = [];
    x.forEach((l => y.push({ lista : l.name, cards : a.cards.filter(c => c.idList == l.id && c.closed == false)})));
    console.log(y);
    y.forEach(l => {
        let s = 0;
        l.cards.forEach( c => {
            const regex = /\((\d+)\)/; // Expresión regular para buscar números entre paréntesis
            let resultado = regex.exec(c.name);
            if( resultado != null ){
                let x = resultado[1];
                //console.log(x)
                s = s + x * 1;
            }
        })
        l.puntos = s;
    })
}




const fechas = [
    { ix: 1, d:'2024-02-02'},
    { ix: 2, d:'2024-02-05'},
    { ix: 3, d:'2024-02-06'},
    { ix: 4, d:'2024-02-07'},
    { ix: 5, d:'2024-02-08'},
    { ix: 6, d:'2024-02-09'},
    { ix: 7, d:'2024-02-12'},
    { ix: 8, d:'2024-02-13'},
    { ix: 9, d:'2024-02-14'},
    { ix: 10, d:'2024-02-15'},
    { ix: 11, d:'2024-02-16'},
    { ix: 12, d:'2024-02-19'},
    { ix: 13, d:'2024-02-20'},
    { ix: 14, d:'2024-02-21'},
    { ix: 15, d:'2024-02-22'},
    { ix: 16, d:'2024-02-23'},
    { ix: 17, d:'2024-02-26'},
    { ix: 18, d:'2024-02-27'},
    { ix: 19, d:'2024-02-28'},
    { ix: 20, d:'2024-02-29'},
];

var dataDates = [];
var a = {};

const getTotalPointsInMont = (pointPlaning) => {
    let totalPoints = 0;
    fechas.forEach(day => {
        const pointPlaningDay = pointPlaning[day.d] ? pointPlaning[day.d] : 0;
        totalPoints += pointPlaningDay*1;
    })
    return totalPoints;
}

generateG = () => {
    let pointPlaning = getPointsByDate();
    let pointReal = getPointsRealByDate();
    let total = getTotalPointsInMont(pointPlaning);
    totalReal = total;

    let lastDate = '2024-02-01';
    dataDates.push(`0,0,0,${total},${totalReal},0`);
    fechas.forEach(day => {
        const pointPlaningDay = pointPlaning[day.d] ? pointPlaning[day.d] : 0;
        const planingDayTotal = total - pointPlaningDay;
        total = planingDayTotal;

        const pointRealDay = pointReal[day.d] !== undefined ? pointReal[day.d] : '';
        const planingRealDayTotal = pointReal[day.d] !== undefined ? totalReal - pointRealDay : '';
        totalReal = planingRealDayTotal;

        
        dataDates.push(`${day.ix},${day.d},${pointPlaningDay},${planingDayTotal},${planingRealDayTotal},${pointRealDay}`);
    })
    console.log(dataDates.join('\n'));
}

const getAllValidList = () => {
    const validLists = a.lists.filter(x => x.closed == false && x.name.indexOf("(HH)") !== -1);
    return validLists.map( l => l.id);
}

const getPointsCard = name => {
    const regex = /\((\d+)\)/; // Expresión regular para buscar números entre paréntesis
    let resultado = regex.exec(name);
    if( resultado == null ){
        return null; 
    }

    let peso = resultado[1];
    return peso;
}

const getPointsByDate = () => {
    const validList = getAllValidList();
    const validLabels = getValidLabels();
    let cardsWithoutDate = [];
    let cardsWithoutPoint = [];
    let cardsWithoutPointAndWithDate = [];
    let cardsWithPointAndWithoutDate = [];

    let pointsByDates = {};
    let pesoTotal = 0;
    let pesoTotalSoloFechas = 0;
    let pesoTotalOtros = 0;
    a.cards.forEach( c => {
        if( c.closed == true ){
            return;
        }

        if(  !validList.includes(c.idList) ){
            return;
        }

        if( c.labels.length == 0){
            return;
        }

        const lablesTemp = c.labels.map(l => l.name );
        if( lablesTemp.includes("Bugs") ){
            return;
        }

        let peso = getPointsCard(c.name);
        if(peso == null ){
            if( c.name.endsWith("-----")){
                return;
            }
            cardsWithoutPoint.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")});
        }

        pesoTotal = pesoTotal + (peso*1);

        if( c.due == null ){
            if( c.name.endsWith("-----")){
                return;
            }

            if(peso != null ){
                cardsWithPointAndWithoutDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")});
            }
            cardsWithoutDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")});
            return;
        }

        pesoTotalSoloFechas = pesoTotalSoloFechas + (peso*1);

        if(peso == null ){
            cardsWithoutPointAndWithDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")}); 
        }

        if( !lablesTemp.every(l => validLabels.has(l))){
            return;
        }

       
        let dateTmp = new Date(c.due);
        dateTmp.setHours(dateTmp.getHours() -5);
        let ixDate = dateTmp.toISOString().split("T")[0];
        if( pointsByDates[ixDate] ){
            pointsByDates[ixDate] += peso*1;
        }
        else{
            pointsByDates[ixDate] = peso*1;
        }

        debugDates.push({date: ixDate, card: c});
        
        pesoTotalOtros = pesoTotalOtros + (peso*1);
    });
    console.log(`PESO TOTAL : ${pesoTotal},  PESO TOTAL SOLO FECHAS : ${pesoTotalSoloFechas},  PESO TOTAL OTRO : ${pesoTotalOtros}`)
    console.log(pointsByDates);
    console.error("Cards sin fecha", cardsWithoutDate);
    console.error("Cards sin puntos", cardsWithoutPoint);
    console.error("Cards con fecha, sin puntos", cardsWithoutPointAndWithDate);
    console.error("Cards sin fecha, con puntos", cardsWithPointAndWithoutDate);
    

    return pointsByDates;
}

// Primero se de ordenar por trello
const getPointsRealByDate = () => {
    const validList = getListDone();
    const validLabels = getValidLabels();
    let doneCardsByDate = [];
    let doneCards = a.cards.filter( c => validList.includes(c.idList) && c.closed == false);
    let doneCardsReverse = [...doneCards].reverse();
    
    let pointsByDay = 0;
    let day = 0;
    let ixDate = ''
    let pointsFinishByDates = {};
    doneCardsReverse.forEach( c => {
        if( c.name.endsWith("-----")){
            day++;
            ixDate = fechas.filter(d => d.ix == day);
            pointsFinishByDates[ixDate[0].d] = pointsByDay;
            pointsByDay = 0;
            return;
        }

        if( c.labels.length == 0 ){
            return;
        }

        const lablesTemp = c.labels.map(l => l.name );
        if( lablesTemp.includes("Bugs") ){
            return;
        }

        if( !lablesTemp.every(l => validLabels.has(l))){
            return;
        }

        let peso = getPointsCard(c.name);
        pointsByDay += peso*1;

       /* let actions = a.actions.filter(a => 
            a.data.card 
            && a.data.card.id == c.id 
            && a.type == "updateCard" 
            && a.data.listAfter
            && validList.includes( a.data.listAfter.id)
        );

        if( actions.length < 1 ){
            return;
        }

        let dateTmp = new Date(actions[0].date);
        dateTmp.setHours(dateTmp.getHours() -5);
        let ixDate = dateTmp.toISOString().split("T")[0];

        let peso = getPointsCard(c.name);

        doneCardsByDate.push({
            name: c.name, 
            date: ixDate,
            labels : c.labels.map( l => l.name).join("-"),
            peso : peso == null ? 0 : peso
        })*/
    });

    day++;
    ixDate = fechas.filter(d => d.ix == day);
    if( ixDate.length > 0 ){
        pointsFinishByDates[ixDate[0].d] = pointsByDay;
        pointsByDay = 0;
    }
   
    console.log(doneCards);
    //console.warn(doneCardsByDate);
    console.log(pointsFinishByDates);
    return pointsFinishByDates;
}

var debugDates = [];

var getListDone = () => a.lists.filter( l => l.name.indexOf("(Done)") !== -1 && l.closed == false ).map( l => l.id); 

// No salen en la grafica los que estan con fecha fuera de octubre, y los puntos que no tienen fecha.

var getValidLabels = () =>{
    // Seleciona los labels de las historias
    const idLists = a.lists.filter( l => l.name.indexOf("(PH)") !== -1 && l.closed == false ).map( l => l.id); // ["651d5f183883ec54cfd5d5d9","651d5f2f7938ec192cf51317"] ;
    const histories = a.cards.filter(c => idLists.includes(c.idList) && c.closed == false ).map( c => c.labels);
    validLables = new Set();
    histories.forEach(h => {
        h.forEach(ls =>{
            validLables.add(ls.name);
        })
    })
    console.log('LabelsValidos : ', validLables);
    return validLables;
}

//-----------------------------------------------------------------------------------------------

window.addEventListener("load", function() {
    $button = document.querySelector('#dataTrelloGenerator');
    $button.addEventListener('click', () => {
        $data = document.querySelector('#dataTrelloJson');
        a = JSON.parse($data.value);

        generateG();
    })
});

// https://codesandbox.io/s/line-chart-with-vanilla-js-and-chartjs-h564y