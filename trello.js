/*
Listas a graficar su nombre debe terminar en (HH)
Los labels validos se toman de las listas que gestionana las hitorias, las cuales su nombre debe terminar en (PH)
Se excluye los tarjetas que tengan el label de "Bugs"
Solo tengo en cuenta las tarjetas con fecha de terminación planeada.
Solo se tienen en cuenta las tarjeta tenga los labels validos (Label que tienen las historias).
Para identificar la lista de tareas terminadas su nombre debe tener (Done)
*/

//-----------------------------------------------------------------------------------------------
var dataTrelloBoard = {};
var dataDates = [];

const datesToGraph = [
    { ix: 1, d:'2024-06-05'},
    { ix: 2, d:'2024-06-06'},
    { ix: 3, d:'2024-06-11'},
    { ix: 4, d:'2024-06-12'},
    { ix: 5, d:'2024-06-13'},
    { ix: 6, d:'2024-06-14'},
    { ix: 7, d:'2024-06-17'},
    { ix: 8, d:'2024-06-18'},
    { ix: 9, d:'2024-06-19'},
    { ix: 10, d:'2024-06-20'},
    { ix: 11, d:'2024-06-21'},
    { ix: 12, d:'2024-06-24'},
    { ix: 13, d:'2024-06-25'},
    { ix: 14, d:'2024-06-26'},
    { ix: 15, d:'2024-06-27'},
    { ix: 16, d:'2024-06-28'},
];

const getPointsCard = name => {
    // const regex = /\((\d+)\)/; // Expresión regular para buscar números entre paréntesis
    const regex = /^\((\d+(\,\d+)?)\)/;
    const resultado = regex.exec(name);
    if( resultado == null ){
        return null; 
    }

    const weight = resultado[1];
    return weight;
}

const printValidLabels = validLabels => {
    const $box = document.querySelector('#validLabels');
    
    let html = '<legend>Labels Validos</legend>';

    validLabels.forEach(l => {
        html += `<span>${l}</span>`
    });

    $box.innerHTML =  html;
}

const printCardsWithError = (listCards, title, idContainer) => {
    const $box = document.querySelector(`#${idContainer}`);
    
    let html = `<legend>${title}</legend>`;

    listCards.forEach(c => {
        html += `<div class="card-error">
            <b>Nombre</b> <a href="${c.url}" target="_blank"> ${c.name} </a>
            <b>Labels</b> <span>${c.labels}</span>
            <b>Members</b> ${c.members.map(m => dataTrelloBoard.members.find(ml => ml.id == m).fullName).join(', ')}
        </div>`
    });

    $box.innerHTML =  html;
}

const getValidLabels = () =>{
    // Seleciona los labels de las historias
    const idStoryLists = dataTrelloBoard.lists.filter( l => l.name.indexOf("(PH)") !== -1 && l.closed == false ).map( l => l.id); 
    const storyCards = dataTrelloBoard.cards.filter(c => idStoryLists.includes(c.idList) && c.closed == false ).map( c => c.labels);

    const validLabels = new Set();
    storyCards.forEach(s => {
        s.forEach(c =>{
            validLabels.add(c.name);
        })
    })

    console.warn('LabelsValidos : ', validLabels);
    printValidLabels(validLabels);

    return validLabels;
}

const getListToGraph = () => {
    const validLists = dataTrelloBoard.lists.filter(x => x.closed == false && x.name.indexOf("(HH)") !== -1);
    return validLists.map( l => l.id);
}

const excludeCard = (card, validList, validLabels, cardsExcludedTemp) => {

    if( card.closed == true ){
        return true;
    }

    if(  !validList.includes(card.idList) ){
        return true;
    }

    // Validar los tarjetas que indican en que día del sprint nos encontramos.
    if (card.name.endsWith("-----")) {
        return true;
    }

    if( card.labels.length == 0){
        cardsExcludedTemp.push({name:card.name, labels : card.labels.map( l => l.name).join(" / ")});
        return true;
    }

    const lablesTemp = card.labels.map(l => l.name );
    if( lablesTemp.includes("Bugs") ){
        cardsExcludedTemp.push({name:card.name, labels : card.labels.map( l => l.name).join(" / ")});
        return true;
    }

    // Verifica que la tarjeta tenga los labels validos
    if( !lablesTemp.some(l => validLabels.has(l))){
        cardsExcludedTemp.push({ name: card.name, labels: card.labels.map(l => l.name).join(" / ") });
        return true;
    }

    return false;
}

const getPointsByDate = () => {
    const validList = getListToGraph();
    const validLabels = getValidLabels();
    
    let cardsWithoutDate = [];
    let cardsWithoutPoint = [];
    let cardsWithoutPointAndWithDate = [];
    let cardsWithPointAndWithoutDate = [];
    let cardsExcluded = [];
    let cardsOutOfDate = [];
    let cardsNoCount = [];

    let pointsByDates = {};
    let totalPoints = 0;
    let totalPointsOnlyDates = 0;
    let totalPointsToGraph = 0;

    dataTrelloBoard.cards.forEach( c => {
        let points = getPointsCard(c.name);
        if( c.closed != true && validList.includes(c.idList) ){
            totalPoints = totalPoints + (points*1);
        }
        
        if( excludeCard(c, validList, validLabels, cardsExcluded) ){
            cardsNoCount.push({name: c.name, list: dataTrelloBoard.lists.find( l => l.id == c.idList).name})
            return;
        }

        if(points == null ){
            cardsWithoutPoint.push({name:c.name, labels : c.labels.map( l => l.name).join(" / "), labelsList : c.labels, members: c.idMembers, url: c.url});
        }

        // Solo tengo en cuenta las tarjetas con fecha de terminación planeada.
        if( c.due == null ){
            if(points != null ){
                cardsWithPointAndWithoutDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")});
            }
            cardsWithoutDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / "), labelsList : c.labels, members: c.idMembers, url: c.url});
            return;
        }

        if(points == null ){
            cardsWithoutPointAndWithDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")}); 
        }

        totalPointsOnlyDates = totalPointsOnlyDates + (points*1);

        let dateTmp = new Date(c.due);
        dateTmp.setHours(dateTmp.getHours() -5);
        let ixDate = dateTmp.toISOString().split("T")[0];

        if( !datesToGraph.find( d => d.d == ixDate) ){
            cardsOutOfDate.push({name:c.name, labels : c.labels.map( l => l.name).join(" / ")});
        }

        if( pointsByDates[ixDate] ){
            pointsByDates[ixDate] += points*1;
        }
        else{
            pointsByDates[ixDate] = points*1;
        }

        totalPointsToGraph = totalPointsToGraph + (points*1);
    });
    console.warn(`PESO TOTAL : ${totalPoints},  PESO TOTAL SOLO FECHAS : ${totalPointsOnlyDates},  PESO TOTAL A GRAFICAR : ${totalPointsToGraph}`)
    console.warn("Puntos por fechas: ", pointsByDates);
    console.error("Cards sin fecha", cardsWithoutDate);
    printCardsWithError( cardsWithoutDate, "Cards sin fecha", 'cardsWithoutDate');
    console.error("Cards sin puntos", cardsWithoutPoint);
    printCardsWithError( cardsWithoutPoint, "Cards sin punto", 'cardsWithoutPoints');
    console.error("Cards con fecha, sin puntos", cardsWithoutPointAndWithDate);
    console.error("Cards sin fecha, con puntos", cardsWithPointAndWithoutDate);
    console.warn("Cards no graficadas", cardsExcluded);
    printCardsExcludes(cardsExcluded);
    console.error("Cards fuera de fecha valida", cardsOutOfDate);
    console.warn("Cards no tenidas en cuenta", cardsNoCount); 
    return pointsByDates;
}

const printCardsExcludes = cardsExcluded => {
    let a = 1;
}

const getDoneList = () => dataTrelloBoard.lists.filter( l => l.name.indexOf("(Done)") !== -1 && l.closed == false ).map( l => l.id); 

const getPointsRealByDate = () => {
    const doneList = getDoneList();
    const validLabels = getValidLabels();

    let doneCardsByDate = [];

    let doneCards = dataTrelloBoard.cards.filter( c => doneList.includes(c.idList) && c.closed == false);
    let doneCardsReverse = [...doneCards].reverse();
    
    let pointsFinishByDates = {};

    doneCardsReverse.forEach( c => {
        let actions = dataTrelloBoard.actions.filter(a =>
            a.data.card
            && a.data.card.id == c.id
            && a.type == "updateCard"
            && a.data.listAfter
            && doneList.includes(a.data.listAfter.id)
        );

        if (actions.length < 1) {
            return;
        }

        if( excludeCard(c, doneList, validLabels, []) ){
            return;
        }

        let dateTmp = new Date(actions[0].date);
        dateTmp.setHours(dateTmp.getHours() - 5);
        let ixDate = dateTmp.toISOString().split("T")[0];

        let points = getPointsCard(c.name);

        doneCardsByDate.push({
            points: points == null ? 0 : points,
            dateDone: ixDate,
            name: c.name,
            labels: c.labels.map( l => l.name).join(" / "),
        })
    });

    doneCardsByDate.forEach( c => {
        const ixDate = c.dateDone;
        const points = c.points;

        if( pointsFinishByDates[ixDate] ){
            pointsFinishByDates[ixDate] += points*1;
        }
        else{
            pointsFinishByDates[ixDate] = points*1;
        }
    });

    console.warn("Cards completadas", doneCardsByDate);
    console.warn("Puntos finalizados por fecha", pointsFinishByDates);
    return pointsFinishByDates;
}

// Primero se de ordenar por trello
const getManualPointsRealByDate = () => {
    const doneList = getDoneList();
    const validLabels = getValidLabels();

    let doneCardsByDate = [];
    let doneCards = dataTrelloBoard.cards.filter( c => doneList.includes(c.idList) && c.closed == false);
    let doneCardsReverse = [...doneCards].reverse();
    
    let pointsByDay = 0; 
    let day = 0; // Indice del array de fechas del sprint
    let ixDate = ''
    let pointsFinishByDates = {};

    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() - 5);
    let currentDateFormat = currentDate.toISOString().split("T")[0];

    doneCardsReverse.forEach( c => {
        if( c.name.endsWith("-----") ){
            day++;
            ixDate = datesToGraph.filter(d => d.ix == day);
            pointsFinishByDates[ixDate[0].d] = pointsByDay;
            pointsByDay = 0;
            return;
        }

        if( c.labels.length == 0 ){
            return;
        }

        if( excludeCard(c, doneList, validLabels, []) ){
            return;
        }

        let points = getPointsCard(c.name);
        pointsByDay += points*1;

        doneCardsByDate.push({
            points: points == null ? 0 : points,
            dateDone: ixDate,
            name: c.name,
            labels: c.labels.map( l => l.name).join(" / "),
        });
    });

    day++;
    ixDate = datesToGraph.filter(d => d.ix == day);

    if( ixDate.length > 0 ){
        pointsFinishByDates[ixDate[0].d] = pointsByDay;
        pointsByDay = 0;
    }

    console.warn("Cards completadas", doneCardsByDate);
    console.warn("Puntos finalizados por fecha", pointsFinishByDates);
    console.error("----------Conteo manual------------");
 
    return pointsFinishByDates;
}


const getTotalPointsInMont = (pointPlaning) => {
    let totalPoints = 0;
    datesToGraph.forEach(day => {
        const pointPlaningDay = pointPlaning[day.d] ? pointPlaning[day.d] : 0;
        totalPoints += pointPlaningDay*1;
    })
    return totalPoints;
}

const printDateToGraph = data => {
    let dataCSV = [];
    let dataHtml = [];

    dataHtml.push(`<tr><td>Días</td><td>Fecha</td><td>HH Planeado</td><td>Planeado Burndown</td><td>Real Burndown</td><td>HH Real</td></tr>`);

    data.forEach(day => {
        dataCSV.push(`${day.numberDay},${day.date},${day.pointDayPlan},${day.totalPointPlan},${day.totalPointReal},${day.pointDayReal}`);
        dataHtml.push(`<tr><td>${day.numberDay}</td><td>${day.date}</td><td>${day.pointDayPlan}</td><td>${day.totalPointPlan}</td><td>${day.totalPointReal}</td><td>${day.pointDayReal}</td></tr>`);
    });

    console.log(dataCSV.join('\n'));
    $box = document.querySelector('#dataTableToGraph');
    $box.innerHTML = `<table>${dataHtml.join('')}</table>`
};

const generateG = () => {
    let poinstPlaning = getPointsByDate();
    let pointReal = getManualPointsRealByDate();
    let total = getTotalPointsInMont(poinstPlaning);
    totalReal = total;

    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() - 5);
    let currentDateFormat = currentDate.toISOString().split("T")[0];

    
    const firstDate = new Date(datesToGraph[0].d);
    firstDate.setDate(firstDate.getDate() - 1);
    const zeroDate = firstDate.toISOString().split('T')[0];

    jsonDataToGraph = [];
    jsonDataToGraph.push({ 
        numberDay: 0, 
        date: zeroDate, 
        pointDayPlan: 0, 
        totalPointPlan: total, 
        totalPointReal: totalReal, 
        pointDayReal: 0 
    })

    datesToGraph.forEach(day => {
        const pointsPlaningDay = poinstPlaning[day.d] ? poinstPlaning[day.d] : 0;
        const planingDayTotal = total - pointsPlaningDay;
        total = planingDayTotal;

        const pointRealDay = day.d >= currentDateFormat ? "" : pointReal[day.d] ? pointReal[day.d] : 0;
        const planingRealDayTotal = day.d >= currentDateFormat ? "" : totalReal - pointRealDay;
        totalReal = planingRealDayTotal;

        jsonDataToGraph.push({ 
            numberDay: day.ix, 
            date: day.d, 
            pointDayPlan: pointsPlaningDay, 
            totalPointPlan: planingDayTotal, 
            totalPointReal: planingRealDayTotal, 
            pointDayReal: pointRealDay 
        })
        
    })

    printDateToGraph(jsonDataToGraph);
}

window.addEventListener("load", function() {
    dataTrelloBoard = {};

    $button = document.querySelector('#dataTrelloGenerator');
    $button.addEventListener('click', () => {
        $data = document.querySelector('#dataTrelloJson');
        dataTrelloBoard = JSON.parse($data.value);

        generateG();
    })
});

// https://codesandbox.io/s/line-chart-with-vanilla-js-and-chartjs-h564y
