const knex = require('knex')(require('./knexfile'))
const utilFunctions = require('./utilFunctions')


function weightedRandom(prob) {
    let i, sum=0, r=Math.random();
    for (i in prob) {
      sum += prob[i];
      if (r <= sum) return Number(i);
    }
  }

const trigger = [
    ["hi","hey","hello","greetings","saluations"],
    ["how", "are", "you", "things"],
    ["what","you","your", "name","called"]
]

const reply = [
    [
        {type:'ornery',values:[{type:'emote',value:'sneers.'},{type:'emote',value:'snarls.'},{type:'say',value:'Whatever.'}]},
        {type:'friendly',values:[{type:'say',value:'Hi there.'},{type:'emote',value:'waves.'},{type:'emote',value:'smiles in greeting.'}]},
        {type:'street',values:[{type:'say',value:'Hey.'},{type:'say',value:"'sup"}]},
        {type:'scholar',values:[{type:'emote', value:'nods gravely.'},{type:'say',value:'Greetings.'}]}
    ],
    [
        {type:'ornery',values:[{type:'emote',value:'barks a short laugh.'},{type:'emote',value:'rolls their eyes.'},{type:'say',value:'Whatever.'}]},
        {type:'friendly',values:[{type:'say',value:'Well, thank you.'},{type:'emote',value:'smiles.'},{type:'emote',value:'gives a thumbs up.'}]},
        {type:'street',values:[{type:'say',value:'Cool. You?'},{type:'say',value:"a'right"}]},
        {type:'scholar',values:[{type:'emote', value:'nods gravely.'},{type:'say',value:'Quite well.'}]}
    ],
    [
        {type:'ornery',values:[{type:'emote',value:'sighs.'},{type:'emote',value:'points at the "people nearby" list irritably.'},{type:'say',value:'Who wants to know?'}]},
        {type:'friendly',values:[{type:'say',value:'My name is /name/.'},{type:'emote',value:'smiles and tells you their name.'}]},
        {type:'street',values:[{type:'say',value:"I'm /name/."},{type:'say',value:"/name/"}]},
        {type:'scholar',values:[{type:'emote', value:'gestures to the "people nearby" list with a knowing smile.'},{type:'say',value:'I am called /name/.'}]}
    ]
]
const countOccurrences = async (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

const normalizeText = (text) => {
    text = text.toLowerCase().replace(/[^\w\s\d]/gi, "");
    text = text
        .replace(/ a /g, " ")
        .replace(/i feel /g, "")
        .replace(/whats/g, "what is")
        .replace(/please /g, "")
        .replace(/ please/g, "");

    return text
}

module.exports = {
    doReaction(data,io) {
        //console.time('doReaction')
        if (data.exit || data.enter) {
            //console.log('moved')
            return
        }
        const msg = data.msg
        const userName = data.userName
        const placeId=data.msgPlaceId
        knex('objects').leftJoin('places','places.placeId','=','objects.placeId').where('objects.placeId','=',placeId).andWhere('objects.isRoot','=',0).select('objects.title','objects.actionStack','places.poi').then(rows => {
            let text = normalizeText(msg)
            const textArray = text.split(" ")
            rows.forEach(object => {
                if (object.actionStack.type === 'NPC' && object.actionStack.useAIBehaviors) {
                    //"behaviors": {"hap": "5", "intel": "16", "advent": "1", "friend": "6", "strength": "1"}, 
                    const {hap, intel, advent, friend,strength} = object.actionStack.behaviors
                    const name=object.title
                    const titleArray = normalizeText(object.title).split(" ")
                    let nameFound = false
                    let hasName = textArray.filter(x => titleArray.includes(x));
                    if (hasName.length > 0) nameFound = true
                    if (textArray.find(item => item === object.title)) nameFound=true
                    
                    utilFunctions.didItHappen({max:20,min:friend}).then( async (willReply) => {
                        if (willReply || nameFound) {
                            const foundWords = []
                            const triggerIndex = textArray.map( (word,i) => trigger.map( (triggerWords,j) => {
                                const foundIndex = triggerWords.indexOf(word)
                                if (foundIndex !== -1) foundWords.push(j)
                                return {i:i,j:j,index:foundIndex}
                            }))
                            if (foundWords.length > 0) {
                                let uniqueIndex = [...new Set(foundWords)];
                                let highIndexCheck=-1
                                let highIndex
                                const highIndexMap = await uniqueIndex.map( async (index) => {
                                    await countOccurrences(foundWords,index).then(occurrences => {
                                        if (occurrences > highIndexCheck) {
                                            highIndexCheck = occurrences
                                            highIndex = index                                            
                                        }
                                        return highIndex
                                    })
                                 
                                })
                                Promise.all(highIndexMap).then(value => {
                                    const responseArray = reply[highIndex]
                                    let friendChance=Math.abs(10-friend)/20
                                    let intelChance=Math.abs(10-intel)/20
                                    let diff = 1 - (friendChance+intelChance)
                                    friendChance += diff/2
                                    intelChance += diff/2
                                    let prob = {0:friendChance,1:intelChance}
                                    let chanceResult = weightedRandom(prob)
                                    let responseType
                                    if (chanceResult === 0) {
                                        let orneryChance = Math.abs(20-friend)/20
                                        let friendlyChance = 1-orneryChance
                                        prob = {0:orneryChance,1:friendlyChance}
                                        chanceResult = weightedRandom(prob)
                                        responseType = (chanceResult === 0) ? 'ornery' : 'friendly'
                                    } else {
                                        let streetChance = Math.abs(20-intel)/20
                                        let scholarChance = 1-streetChance
                                        prob = {0:streetChance,1:scholarChance}
                                        chanceResult = weightedRandom(prob)
                                        responseType = (chanceResult === 0) ? 'street' : 'scholar'
                                    }
                                    const responseValues = responseArray.find(a => a.type === responseType)
                                    utilFunctions.diceRoll({max:responseValues.values.length, mod:1}).then (item => {
                                        const finalResponse = responseValues.values[item-1]
                                        let channel = `place:${placeId}`
                                        const data = {msg: finalResponse.value.replace('/name/',object.title), msgPlaceId: placeId, userName: name, src: 'NPC'}
                                        switch (finalResponse.type) {
                                            case 'emote' :  
                                                data.emote = true
                                                io.emit(channel, {msg: data})
                                                break;
                                            case 'say'   :                                                
                                                io.emit(channel, {msg: data})
                                                break;
                                            default      : break;
                                        }
                                    })
                                })
                            }
                        }
                    })
                }
            })
        })
        //console.timeEnd('doReaction')
    }

}