/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */
import { useEffect, useState, useContext, useRef } from "react";
import { uniqBy } from 'lodash';
import Avatar from "../avatar/Avatar";
import Logo from "../logo/Logo";
import {UserContext} from '../../UserContext'
import axios from "axios";

export default function Chat(){

    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {username, id} = useContext(UserContext);
    const [newMessageText, setNewMessageText]= useState('');

    const [messages, setMessages]= useState([]);
    const divUnderMessages = useRef()


    useEffect(() => {
        connectToWs()
    },[]);

    function connectToWs(){
        const ws = new WebSocket('ws://localhost:4000')
        setWs(ws)
        ws.addEventListener('message', handleMessage)
        ws.addEventListener('close', () => connectToWs())
    } 

    function showOnlinePeople(peopleArray){
        const people = {};
        peopleArray.forEach(({userId, username}) => {
            people[userId] = username;
        })

        setOnlinePeople(people)
    }

    function handleMessage(e) {
        const messageData = JSON.parse(e.data);
       if('online' in messageData) {
        showOnlinePeople(messageData.online)
       } else if ('text' in messageData) {
        setMessages(prev => ([...prev, {...messageData}]))
       }
    }
    

    const onlinePeopleExcludingOurUser = {...onlinePeople};
    delete onlinePeopleExcludingOurUser[id];

    function sendMessage(e) {
        e.preventDefault();
        ws.send(JSON.stringify({
                recipient: selectedUserId,
                text: newMessageText,
        }))
        setNewMessageText('');
        setMessages(prev => ([...prev, {
            text: newMessageText, 
            sender: id,
            recipient: selectedUserId,
            id: Date.now(),
        }]));

    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
        div.scrollIntoView({behavior:'smooth', block:'end'})
        }
    }, [messages]) 


    useEffect(() => {
        if(selectedUserId){
            axios.get(`/messages/${selectedUserId}`)
        }

    }, [selectedUserId])

    
    const messagesWithoutDupes = uniqBy(messages, 'id');

// ..

    return ( 

        <div className="flex h-screen">

            <div className="bg-gray-50 w-1/3 pt-4">
                <Logo />
                {Object.keys(onlinePeopleExcludingOurUser).map(userId => (
                    <div key={userId} onClick={()=> setSelectedUserId(userId)} 
                    className={`border-b border-gray-100 py-2 flex items-center gap-2 cursor-pointer ${userId === selectedUserId ? 'bg-white' : ''}`}>
                        {userId === selectedUserId && (
                            <div className="w-1 bg-blue-500 h-8 rounded-r-lg"></div>
                        )}
                        <div className="flex items-center pr-2"></div>
                        <Avatar username={onlinePeople[userId]} userId={userId} />
                        <span className="text-gray-800">
                            <span className={userId === selectedUserId ? 'font-bold' : ''}>
                          {onlinePeople[userId]}
                            </span>
                        </span>
                    </div>
                ))}
            </div>  

            <div className="flex flex-col bg-white w-2/3 p-2">
                
                <div className="flex-grow flex items-center">
                    {!selectedUserId ? (
                        <div className="text-center w-full text-gray-500 capitalize">
                           &larr; Start a conversation with your contacts from the sidebar
                        </div>
                    ) : (
                        <div className="relative h-full w-full">
                            <div className="overflow-y-scroll absolute inset-0">
                                {messagesWithoutDupes.map((message) => (
                                    <div className={`${message.sender === id ? 'text-right' : 'text-left'}`}>
                                    <div className={
                                        `overflow-hidden text-left shadow-lg border-1 border-gray-400  inline-block p-2 my-1 rounded-full  text-sm ${message.sender === id ? 
                                        'bg-blue-500 text-white' : 
                                        'bg-white text-black'}`}>
                                        {message.text}
                                    </div>
                                    </div>
                                ))}
                                <div ref={divUnderMessages}></div>
                            </div>
                        
                        </div>
                    )}
                    </div>

                  {selectedUserId && (

                <form onSubmit={sendMessage} className="flex gap-2">

                    <input value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)} type="text" placeholder="Type your message here" className="bg-white border p-2 flex-grow rounded-md" />

                    <button type="submit" className="bg-blue-500 p-2 text-white rounded-md" >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
</svg>
                    </button>

                </form>
                        )}

            </div>
        </div>
    )
}