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
    ["what","you","your", "name","called"],
    ["what","is","up",],
    ["smile","smiles","grin","grins","laugh","laughs"],
    ["fine","good","pretty","ok","fantastic","peachy","happy"],
    ["bad","terrible","horrible","horrific","sad","saddened","saddens","lonely"]

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
    ],
    [
        {type:'ornery',values:[{type:'emote',value:'shrugs.'},{type:'emote',value:'shakes his head.'},{type:'say',value:'Nothing.'}]},
        {type:'friendly',values:[{type:'say',value:'This and that, how about yourself?'},{type:'emote',value:'nods happily.'}]},
        {type:'street',values:[{type:'say',value:"Not much."},{type:'say',value:"Nothing much."}]},
        {type:'scholar',values:[{type:'emote', value:'points upward.'},{type:'say',value:"I'm not busy at the moment, if that is to what you are referring."}]}
    ],
    [
        {type:'ornery',values:[{type:'emote',value:'shows their teeth.'},{type:'emote',value:'frowns.'},{type:'emote',value:'snorts softly.'}]},
        {type:'friendly',values:[{type:'say',value:"You have a nice smile."},{type:'emote',value:'smiles back.'}]},
        {type:'street',values:[{type:'say',value:"Nice."},{type:'emote',value:"grins back."}]},
        {type:'scholar',values:[{type:'emote', value:'gives a wan smile.'},{type:'say',value:"Well, then."}]}
    ],
    [
    {type:'ornery',values:[{type:'emote',value:'sniffs indignantly.'},{type:'emote',value:'is irritated.'},{type:'emote',value:'is done with you.'}]},
    {type:'friendly',values:[{type:'say',value:"That's great!"},{type:'emote',value:'does a happy dance.'}]},
    {type:'street',values:[{type:'say',value:"Good."},{type:'emote',value:"throws a peace sign."}]},
    {type:'scholar',values:[{type:'emote', value:'nods in acknowledgement.'},{type:'say',value:"Excellent."}]}
    ],
    [
    {type:'ornery',values:[{type:'emote',value:'hides a self satisfied smile.'},{type:'emote',value:'raises their eyebrows.'},{type:'emote',value:'shrugs dismissively.'}]},
    {type:'friendly',values:[{type:'say',value:"Oh no, I'm sorry."},{type:'emote',value:'gives a hug.'}]},
    {type:'street',values:[{type:'say',value:"It happens."},{type:'emote',value:"grimaces."}]},
    {type:'scholar',values:[{type:'emote', value:'has often felt the same.'},{type:'say',value:"I understand."}]}

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

const checkObjectText = async (reactionStack, textArray) => {

    const retObject = {
        text: "",
        type: "emote",
    }

    const triggerArray = reactionStack.map(reaction => reaction.commandAction.split(" "))
    const replyArray = reactionStack.map(reaction => reaction.elementList.map(element => element.commandResult))

    const foundWords = []
    const triggerIndex = textArray.map( (word,i) => triggerArray.map( (triggerWords,j) => {
        const foundIndex = triggerWords.indexOf(word)
        if (foundIndex !== -1) foundWords.push(j)
        return {i:i,j:j,index:foundIndex}
    }))
    let highIndexMap
    let highIndexCheck=-1
    let highIndex
    if (foundWords.length > 0) {
        let uniqueIndex = [...new Set(foundWords)];
        highIndexMap = await uniqueIndex.map( async (index) => {
            await countOccurrences(foundWords,index).then(occurrences => {
                if (occurrences > highIndexCheck) {
                    highIndexCheck = occurrences
                    highIndex = index                                            
                }
                return new Promise(resolve => resolve(highIndex))
            })
        })
    } else return null
    return Promise.all(highIndexMap).then(value => {
        const responseArray = replyArray[highIndex]
        const finalResponse = responseArray.join(" ")
        retObject.text=finalResponse
        return new Promise(resolve => resolve(retObject))
    })
}

module.exports = {
    doReaction(data,io) {
        //console.time('doReaction')
        if (data.exit || data.enter) return //enter/exit room message
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

                           await checkObjectText(object.actionStack.reactionStack, textArray).then( async (uniqueResponse) => {
                            if (uniqueResponse !== null && typeof (uniqueResponse) === 'object') {
                                const finalResponse = uniqueResponse.text
                                let channel = `place:${placeId}`
                                const data = {msg: finalResponse.replace('/name/',object.title).replace('npcName',object.title).replace('userName',userName), msgPlaceId: placeId, userName: name, src: 'NPC'}
                                switch (uniqueResponse.type) {
                                    case 'emote' :  
                                        data.emote = true
                                        io.emit(channel, {msg: data})
                                        break;
                                    case 'say'   :                                                
                                        io.emit(channel, {msg: data})
                                        break;
                                    default      : break;
                                }
                                return
                            } else {
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
                                            const data = {msg: finalResponse.value.replace('/name/',object.title).replace('npcName',object.title).replace('userName',userName), msgPlaceId: placeId, userName: name, src: 'NPC'}
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
                                    
                            }}})
                        }
                    })
                }
            })
        })
        //console.timeEnd('doReaction')
        return
    }

}