/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */
import axios from "axios";
import { useEffect, useState, useContext, useRef } from "react";
import { uniqBy } from 'lodash';
import {UserContext} from '../../UserContext'
import Contact from "../contact/Contact";
import icon from '../../../public/icon.jpg'
// import Avatar from "../avatar/Avatar";
// import Logo from "../logo/Logo";

export default function Chat(){

    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {username, id, setId, setUsername} = useContext(UserContext);
    const [newMessageText, setNewMessageText]= useState('');
    const [offlinePeople, setOfflinePeople] = useState({});
    const [messages, setMessages]= useState([]);
    const divUnderMessages = useRef();

    const [peopleMenu, setPeopleMenu] = useState(false)
  
    useEffect(() => {
        connectToWs()
    },[]);

    function connectToWs(){
        const ws = new WebSocket('wss://comma-backend.onrender.com')
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
        if (messageData.sender === selectedUserId) {
            setMessages(prev => ([...prev, {...messageData}]))
        }
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

    function menuToggle() {
        if (peopleMenu) {
            console.log('show menu')
            setPeopleMenu(!peopleMenu)
        } else {
            console.log('hide menu')
            setPeopleMenu(!peopleMenu)
        }
    }

    return ( 

        <div className="flex h-screen">
            
            <nav style={{'zIndex': 9999}} className=" fixed bg-white w-full shadow-md">
                <div className="mx-auto w-full text-center font-bold flex flex-grow justify-between">

                    <button className="m-0 py-3 px-5">
                    <img src={icon} width="25" alt="app logo" />

                    </button>

{/* People Button */}
                    <button onClick={menuToggle} className="m-0 py-3 px-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
</svg>
    
                    </button>

                    <button onClick={logout} className="m-0 py-3 px-5 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
</svg>

                    </button>

                </div>
            </nav>

             <div className={`bg-gray-100 w-1/3 pt-4 lg:flex md:flex flex-col ${peopleMenu ? 'inline' : 'hidden'} drop-shadow-md`}>
                <div className="flex-grow pt-10">
                {/* <Logo /> */}
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

                <div className="p-2 flex justify-center mt-10">
                    <a href="#" target="_blank">
                        <img width={40} src="https://th.bing.com/th/id/R.724794164fb289dd2f7d69dde7ac3bc0?rik=H5bTVhjLhZdHOQ&pid=ImgRaw&r=0" alt="github repo" />
                    </a>
                </div>

            </div>  

            <div className="flex flex-col  w-full p-2 zIndex-1 mt-[2.8rem]">
                
                <div className="flex flex-grow items-center">
                    {!selectedUserId ? (
                        <div className="text-center w-full text-gray-500 capitalize">
                            Start a conversation with your contacts from the sidebar
                        </div>
                    ) : (
                        <div className="relative h-full w-full">
                            <div className="overflow-y-scroll absolute inset-0">
                                {messagesWithoutDupes.map((message) => (
                                    <div key={message._id} className={`${message.sender === id ? 'text-right' : 'text-left'}`}>
                                    <div className={
                                        `overflow-hidden text-left shadow-lg font-semibold inline-block p-2 my-1 rounded-full  text-sm ${message.sender === id ? 
                                        'bg-blue-500 text-white' : 
                                        'bg-[#ff5c6a] text-white'}`}>
                                        {message.text}
                                        {message.file && (
                                            <div>
                                                <a target="_blank" className="flex items-center gap-1 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-5 h-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
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

                <form onSubmit={sendMessage} className="flex gap-2 pt-2">

                    <input value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)} type="text" placeholder="Type your message here" className="bg-white border p-2 flex-grow rounded-md" />
<label type="button" className="bg-gray-200 p-2 text-gray-600 border border-gray-300 rounded-md cursor-pointer">
    <input type="file" className="hidden" onChange={sendFile} />
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" class="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
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
