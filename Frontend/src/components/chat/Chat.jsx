/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */
import { useEffect, useState, useContext, useRef } from "react";
import { uniqBy } from 'lodash';
import Avatar from "../avatar/Avatar";
import Logo from "../logo/Logo";
import {UserContext} from '../../UserContext'
import axios from "axios";
import Contact from "../contact/Contact";

export default function Chat(){

    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {username, id, setId, setUsername} = useContext(UserContext);
    const [newMessageText, setNewMessageText]= useState('');
    const [offlinePeople, setOfflinePeople] = useState({});
    const [messages, setMessages]= useState([]);
    const divUnderMessages = useRef();

  
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

        setOnlinePeople(people);
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

    function sendMessage(e, file = null) {
        if(e) e.preventDefault();
        ws.send(JSON.stringify({
                recipient: selectedUserId,
                text: newMessageText,
                file
        }))
        
        if (file) {
            axios.get('/messages'+selectedUserId).then(res => {
                setMessages(res.data)
            })
        } else {
            setNewMessageText('');
            setMessages(prev => ([...prev, {
            text: newMessageText, 
            sender: id,
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
        }

    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
        div.scrollIntoView({behavior:'smooth', block:'end'})
        }
    }, [messages]) 


    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
            .filter(person => person._id !== id)
            .filter(person => !Object.keys(onlinePeople).includes(person._id))
            const offlinePeople = {}
            offlinePeopleArr.forEach((person) => {
                offlinePeople[person._id] = person
            })
            setOfflinePeople(offlinePeople);
        });
    }, [onlinePeople])


    useEffect(() => {
        if(selectedUserId){
            axios.get(`/messages/${selectedUserId}`).then(res => {
                setMessages(res.data)
            })
        }

    }, [selectedUserId])

    
    const messagesWithoutDupes = uniqBy(messages, '_id');

    function sendFile(e){
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload =() => {
            sendMessage(null, {
                name: e.target.files[0].name,
                data: reader.result
            });
        };
    }

    function logout() {
        axios.post('/logout')
        .then(() => {
            setWs(null)
            setId(null);
            setUsername(null)
            location.reload();
        })
    }

    return ( 

        <div className="flex h-screen">

            <div className="bg-gray-50 w-1/3 pt-4 flex flex-col">
                <div className="flex-grow">
                <Logo />
                    {Object.keys(onlinePeopleExcludingOurUser).map(userId => (
                    <Contact 
                    key={userId}
                    id={userId} 
                    online={true}offlinePeople
                        username={onlinePeopleExcludingOurUser[userId]} 
                        onClick={()=> setSelectedUserId(userId)}
                        selected={userId === selectedUserId}
                        />
                    ))}

                    {Object.keys(offlinePeople).map(userId => (
                    <Contact 
                    key={userId}
                    id={userId} 
                    online={false}
                        username={offlinePeople[userId].username} 
                        onClick={()=> setSelectedUserId(userId)}
                        selected={userId === selectedUserId}
                        />
                    ))}
                </div>

                <div className="p-2 text-center flex items-center justify-center">
                    <span className="mr-2 text-sm text-gray-600 capitalize flex items-center">Hey {username}</span>
                    <button onClick={logout} className="text-sm text-red-600 font-semibold shadow-sm bg-red-200 py-2 px-4 rounded-md ">Logout</button>
                </div>

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
                                    <div key={message._id} className={`${message.sender === id ? 'text-right' : 'text-left'}`}>
                                    <div className={
                                        `overflow-hidden text-left shadow-lg border-2 border-gray-100 font-semibold inline-block p-2 my-1 rounded-md  text-sm ${message.sender === id ? 
                                        'bg-blue-500 text-white' : 
                                        'bg-white text-black'}`}>
                                        {message.text}
                                        {message.file && (
                                            <div>
                                                <a target="_blank" className="flex items-center gap-1 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
</svg>
                                                    {message.file}</a>
                                            </div>
                                        )}
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
<label type="button" className="bg-gray-200 p-2 text-gray-600 border border-gray-300 rounded-md cursor-pointer">
    <input type="file" className="hidden" onChange={sendFile} />
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
</svg>

</label>
                    <button type="submit" className="bg-blue-500 p-2 text-white text-semibold rounded-md" >
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