import requests
from pathlib import Path

ROOT=Path(r"C:\Users\권형석\Documents\indieplus-pohang\assets\share")
ROOT.mkdir(parents=True,exist_ok=True)
H={"User-Agent":"Mozilla/5.0"}

ASSETS={
"mahjong":[
("poster","https://laboutique.carlottafilms.com/cdn/shop/files/AFFMAHJONGHD.jpg?v=1751645346"),
("still1","https://s3.amazonaws.com/criterion-production/janus_stills/6067-/34090id__0003_34090id_27_w1600.jpg"),
("still2","https://image.cine21.com/resize/cine21/movie/2025/1014/10_42_37__68edaa8de1e23%5BS1000%2C1000%5D.jpg"),
("still3","https://uncaged.asia/content/images/2024/04/LqTB4h6Q9Sc8DqjKOrkB18C_qFbT4yyD71ddnfWWtZk.jpg")
],
"happyend":[
("poster","https://api.esquirehk.com/var/site/storage/images/_aliases/img_804_w_only/4/8/4/0/6630484-1-chi-HK/happyend-hk.jpeg"),
("still1","https://bamlive.s3.amazonaws.com/styles/program_slide/s3/1200_Sora_Happyend_002.jpg?itok=zwrzoyX-"),
("still2","https://cdn.i-scmp.com/sites/default/files/styles/1020x680/public/d8/images/canvas/2025/01/21/8976f69c-5fac-48c7-9202-6e0a7d860ffe_5e36803d.jpg?itok=J9JthSYb&v=1737429025"),
("still3","https://www.bitters.co.jp/HAPPYEND/images/cast/02.jpg"),
("still4","https://image.cine21.com/resize/cine21/movie/2025/0425/14_47_00__680b21d445975%5BH800-%5D.jpg")
],
"stopmaking":[
("poster","https://movingstory-prod.imgix.net/movies/posters/sms.jpg"),
("still1","https://images.rollingstonejapan.com/articles_photos/35976/ORG/bf6d51ab65be3500603bdf97add77f92.jpg"),
("still2","https://bigotherbigother.files.wordpress.com/2012/07/david-byrne-lamp.jpg"),
("still3","https://assets.eyefilm.nl/images/production/_2880x1620_crop_center-center_none/still_Stop-Making-Sense-Jonathan-Demme-US-1984-1.jpg")
]
}

for slug,items in ASSETS.items():
    for label,url in items:
        dest=ROOT/f"crit-{slug}-{label}.jpg"
        try:
            r=requests.get(url,headers=H,timeout=30)
            r.raise_for_status()
            dest.write_bytes(r.content)
            print(slug,label,len(r.content))
        except Exception as e:
            print("FAIL",slug,label,e)
