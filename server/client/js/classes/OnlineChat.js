/**
     * =================================
     *      Online Chat Manager
     * =================================
     */

export default class OnlineChat{
    constructor(socketIO){

        /* Initialize Parent's socket */
        this.socketIO = socketIO

        /* Default it will be false */
        this.active = false

        /* Get chat settings */
        this.inputChat = document.getElementById('chat-message')
        this.messages = document.getElementById('chatMessages')

        /* Add controls */
        this.addChatControls()
        this.addSocketListeners()
    }

    /** 
     * =============================
     *      add Listeners
     * =============================
    */
    addChatControls(){
        this.inputChat.onfocus = () => this.active = true
        this.inputChat.onblur =() => this.active = false

        window.addEventListener('keydown', (e) => {
            if(e.key.toLowerCase() == 'enter'){

                if(this.active){
                    this.inputChat.blur()
                    this.emitMessage()
                }
                else
                    this.inputChat.focus()
            }   
        })
    }

    addSocketListeners(){
        this.socketIO.on('new Chat Message', (data) => {

            /* Create message HTML node */
            let message = document.createElement('p')
            message.className = 'single-comment'

            message.innerHTML = `<span> ${data.name}</span>: ${data.text}`
            this.messages.append(message)

            /* Scroll to the new message */
            this.messages.scroll(0, this.messages.scrollHeight)
        })

        this.socketIO.on('banned', (data) => {
            window.location.replace(window.location.href)
        })
    }
    /**
     * ================================
     *  Emit Messages througth socket
     * ================================
     */

    emitMessage(){
        /* Emit the message */
        const url = new URLSearchParams(window.location.search)
        const adminID = url.get('adminID')

        if(this.inputChat.value != ''){
            this.socketIO.emit('Chat Message', {
                text: this.inputChat.value,
                adminID: adminID
            })
    
            /* Reset the content */
            this.inputChat.value = ""
        }
        
    }
}