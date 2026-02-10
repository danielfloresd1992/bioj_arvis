



export default function ShowData({user=null}){


    const changeDns = (dns) => {
        if(!dns) return null;

        return 'https://amazona365.ddns.net:3006' +dns.split('https://amazona365.ddns.net')[1]
    }


    return(
        <div 
            style={{
                width: '100%',
                height: '100%',
            }}
        >
            {
                user ?
                    <div  style={{
                            width: '100%',
                            height: '100%',
    
                        }}
                    >
                        <img style={{width:'100%', /* nunca será más ancha que el padre */ height: '80%', objectFit: 'contain'}} src={changeDns(user.img)} alt="" />
                        <div style={{
                            height: '20%',
                            color:'#000'
                        }}>
                            <p style={{fontSize: '1.1rem'}}>{user.name}</p>
                            <p style={{fontSize: '1.1rem'}}>CI {user.dni}</p>
                        </div>
                    </div>
                :
                null
            }
        </div>
    )
}