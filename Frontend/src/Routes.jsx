import RegisterAndLoginForm from "./components/register/RegisterAndLoginForm";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import Chat from "./components/chat/Chat";

export default function Routes(){

    const {username} = useContext(UserContext);

    if(username){
        return <Chat />
    } else {
    return (
        <RegisterAndLoginForm />
    )
}}