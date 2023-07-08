import axios from 'axios'
import { useContext, useState } from "react"
import { UserContext } from "../../UserContext";
import icon from '../../assets/icon.jpg'


export default function RegisterAndLoginForm() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [isLoginOrRegister, setIsLoginOrRegister] = useState('Register')

    // eslint-disable-next-line no-undef
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

    async function handleSubmit(event) {
        event.preventDefault();
        const url = isLoginOrRegister === 'Register' ? 'register' : 'login';
       const {data} = await axios.post(url, { username, password });
       
       setLoggedInUsername(username);
       setId(data.id);

    }

   

return (
    <>
    <div className="bg-white max-w-[1424px] mx-auto h-screen flex">
    
    {/* Right side */}
    <div className="hidden md:inline lg:inline xl:inline leftSide w-2/3 items-center" 
    style={{
        'background-image': 'linear-gradient(to top, #f77062 0%, #fe5196 100%)'

    }}>

        <div className="flex flex-col items-center justify-center w-full h-screen">
            <img src={icon} className='w-[90px] mt-[-100px] shadow-md rounded-full m-5' />
            <div className="max-w-[400px] px-[30px] text-center">
            <h1 className="text-white font-bold text-[19px] mb-2">New? Create Account Now</h1>
            <h3 className='text-white font-semibold text-[15px] mb-8'>To keep connected with us please create an account now using your personal info</h3>
            <a href="#" target='_blank' className="bg-white px-5 py-3 text-[14px] rounded-full font-bold shadow-md border hover hover:bg-gray-200 text-gray-800 hover:text-black">Github Repository &rarr;</a>
            </div>
            
        </div>

    </div>

    {/* Left side */}
    <div className="mx-auto rightSide w-full bg-gray-50 items-center pt-[150px] ">
        <div className="mx-auto text-center">
            <h1 className='text-[35px] font-bold text-[#ff5c6a] drop-shadow-md'>Welcome Back! 😍</h1>
            <h3 className='text-gray-900 text-[15px] my-4 w-[65%] mx-auto mb-10'>Welcome to our vibrant and engaging chat community! We are thrilled to have you here, ready to connect with amazing people from around the world.</h3>
        </div>

    <div className="mx-auto" style={{'max-width': 'max-content'}}>
               <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>

                     <input value={username} onChange={event => setUsername(event.target.value)} type="text" placeholder="Username" className="block w-full rounded-full p-2 mb-2 border" />

                     <input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="Password" className="block w-full rounded-full p-2 mb-2 border" />

                     <button type="submit" style={{background: 'linear-gradient(to top, #f77062 0%, #fe5196 100%)'}} className="text-white p-2 block w-full rounded-full font-bold ">{isLoginOrRegister === 'Register' ? 'Register' : 'Sign In'}</button>
                    <div className="mt-5 text-center text-[14px]">
                        {isLoginOrRegister === 'Register' && (
                             <div>
                            Already a member?
                              <button onClick={()=> setIsLoginOrRegister('login')} className='text-blue-600 ml-2 font-bold'>Sign In Now</button>
                            </div>
                        )}

                        {isLoginOrRegister === 'login' && (
                            <div>
                            Dont have an account?
                              <button onClick={()=> setIsLoginOrRegister('Register')} className='text-blue-600 ml-2 font-bold'>Register</button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
    </div>
    </div>
    
    </>
)

    // return (
    //     <>
    //         <div className="bg-gray-50 h-screen flex items-center">
    //             <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>

    //                 <input value={username} onChange={event => setUsername(event.target.value)} type="text" placeholder="Username" className="block w-full rounded-md p-2 mb-2 border" />

    //                 <input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="Password" className="block w-full rounded-md p-2 mb-2 border" />

    //                 <button type="submit" className="bg-blue-500 text-white p-2 block w-full rounded-md ">{isLoginOrRegister === 'Register' ? 'Register' : 'Sign In'}</button>
    //                 <div className="mt-5 text-center">
    //                     {isLoginOrRegister === 'Register' && (
    //                         <div>
    //                         Already a member?
    //                           <button onClick={()=> setIsLoginOrRegister('login')} className='text-blue-600 ml-2'>Sign In Now</button>
    //                         </div>
    //                     )}

    //                     {isLoginOrRegister === 'login' && (
    //                         <div>
    //                         Dont have an account?
    //                           <button onClick={()=> setIsLoginOrRegister('Register')} className='text-blue-600 ml-2'>Register</button>
    //                         </div>
    //                     )}
    //                 </div>
    //             </form>
    //         </div>
    //     </> 
    // )
}