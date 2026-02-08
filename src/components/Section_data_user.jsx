



export default function ShowData({user=null}){


    const changeDns = (dns) => {
        if(!dns) return null;

        return 'https://72.68.60.201' +dns.split('https://amazona365.ddns.net')[1]
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
                            height: '80%',
    
                        }}
                    >
                        <img style={{width:' 100%', /* nunca será más ancha que el padre */ height: '100%', objectFit: 'contain'}} src={changeDns(user.img)} alt="" />
                        <div style={{
                            height: '20%'
                        }}>
                            <p style={{fontSize: '1.4rem'}}>{user.name}</p>
                            <p style={{fontSize: '1.4rem'}}>CI {user.dni}</p>
                        </div>
                    </div>
                :
                null
            }
        </div>
    )
}