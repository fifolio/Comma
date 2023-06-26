/* eslint-disable react/prop-types */
import axios from 'axios';
import {createContext, useState, useEffect} from 'react'
export const UserContext = createContext({});

export function UserContextProvider({children}){

    const [username, setUsername] = useState(null);
    const [id, setId] = useState(null);

    useEffect(()=> {
        axios.get('/profile')
        .then(res => {
            setId(res.data.userId)
            setUsername(res.data.username)
        })
    },[])

    const value = {
        username, 
        setUsername,
        id,
        setId
    }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}