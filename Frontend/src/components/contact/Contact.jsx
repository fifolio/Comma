/* eslint-disable react/prop-types */
import Avatar from "../avatar/Avatar";

export default function Contact({id, onClick, selected, username, online }){
    return (
        <div key={id} onClick={()=> onClick(id)} 
        className={`border-b border-gray-100 py-2 flex items-center gap-2 cursor-pointer ${id === selected ? 'bg-white' : ''}`}>
            {selected && (
                <div className="w-1 bg-blue-500 h-8 rounded-r-lg"></div>
            )}
            <div className="flex items-center pr-2"></div>
            <Avatar online={online} username={username} userId={id} />
            <span className="text-gray-800">
                <span className={id === selected ? 'font-bold' : ''}>
              {username}
                </span>
            </span>
        </div>
    )
}