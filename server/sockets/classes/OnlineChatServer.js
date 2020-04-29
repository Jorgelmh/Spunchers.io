class OnlineChatServer{
    constructor(){
        this.messages = []

        /* Command keywords */
        this.keywords = ['ban']
    }

    checkCommand(message, isAdmin){
        if(message[0] === '/'){
            
            if(isAdmin){

                let text = message.substring(1)
                text.trim()
    
                /* Extracting Stuff */
    
                let command = text.split(' ')
                let name = text.split(`${command[0]} `)[1]
    
                return {
                    keyword: command[0],
                    name
                }
            }
            return true
        }
        return false
    }

    addMessage(name, text){
        this.messages.push({
            name,
            text
        })
    }
}

module.exports = OnlineChatServer