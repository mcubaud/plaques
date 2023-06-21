var derniereModif=document.lastModified;
var dateModif = new Date(derniereModif);
var options = {  year:"numeric",month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit"};
var dateHeure = new Intl.DateTimeFormat("fr-FR",options).format;
var jour = dateModif.getDate();
var mois=dateModif.getMonth()+1;
var annee=dateModif.getFullYear();
var heures=dateModif.getHours();
var minutes=dateModif.getMinutes();

var highscore_plaques=0
if (!localStorage.getItem("highscore_plaques")){
    localStorage.setItem("highscore_plaques",0);
}else{
    highscore_plaques=localStorage.getItem("highscore_plaques");
}

var modified_plaques={};

///affichage de la carte
var mymap = L.map('mapid').setView([46.875378329598036, 2.565228180873064], 4);
layer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Dernière mise à jour le '+dateHeure(dateModif),maxZoom: 22, maxNativeZoom :19,
}).addTo(mymap);


var LayersMarker = new L.FeatureGroup().addTo(mymap);
var LayermarkerClusters = L.markerClusterGroup(
    {singleMarkerMode:true}
);
mymap.addLayer(LayermarkerClusters)
var liste_noms_couleurs={};
var en_train_de_jouer=false;
var count=0;
var stats_ouvert=false;

var json_plaques={};
var promise0 = new Promise((resolve, reject) => {
    fetch("plaques.geojson")
    .then(r => r.json())
    .then(r => {
        json_plaques = r;
        promise = new Promise((resolve, reject) => {
            resolve(json_plaques);
        });
        resolve(r);
    })
});
var promise = promise0;


var filtre={"nom":"","type":"","date":"","dep":""};
var filtre_doublon=false;
affichage=document.getElementById("Affichage");
changer_affichage();

var filières;
fetch("filieres.json")
.then(r => r.json())
.then(r => {
    console.log(r);
    filières  = r
})


function passer_le_filtre(obj){
    if(filtre_doublon && obj.properties.Doublon>0){
        return false;
    }
    if(filtre.date==""){
        return (filtre_avec_separateur(filtre.nom,obj.properties.Personne) || (document.getElementById("checkbox_"+obj.properties.Personne) && document.getElementById("checkbox_"+obj.properties.Personne).checked))
                 && filtre_avec_separateur(filtre.type,obj.properties.Type)
                 && (filtre.dep=="" || ((obj.properties.code && (filtre_avec_separateur(filtre.dep,obj.properties.code)) || (obj.properties.nom && filtre_avec_separateur(filtre.dep,obj.properties.nom)))));
    }else if(obj.properties.datePubli){
        return (filtre_avec_separateur(filtre.nom,obj.properties.Personne)||(document.getElementById("checkbox_obj.properties.Personne")&&document.getElementById("checkbox_obj.properties.Personne").checked))
                 && filtre_avec_separateur(filtre.type,obj.properties.Type) 
                 && (filtre.dep=="" || ((obj.properties.code && (filtre_avec_separateur(filtre.dep,obj.properties.code)) || (obj.properties.nom && filtre_avec_separateur(filtre.dep,obj.properties.nom)))))
                 & obj.properties.datePubli.toLowerCase().includes(filtre.date);
    }
    return false;
	
}

function filtre_avec_separateur(le_filtre,propriete){
    if(le_filtre==""){
        return true;
    }
    if(le_filtre.startsWith("!")){
        passer_le_filtre_nom=true;
        liste_nom=le_filtre.split("!")[1].split("|");
        liste_nom.forEach(nom => {
            if(nom.startsWith("~")){
                nom=nom.split("~")[1];
                passer_le_filtre_nom=passer_le_filtre_nom && !(propriete.toLowerCase().includes(nom));
            }else{
                passer_le_filtre_nom=passer_le_filtre_nom && !(propriete.toLowerCase()==nom);
            }
            
        });
    }else{
        passer_le_filtre_nom=false;
        liste_nom=le_filtre.split("|");
        liste_nom.forEach(nom => {
            if(nom.startsWith("~")){
                nom=nom.split("~")[1];
                passer_le_filtre_nom=passer_le_filtre_nom || propriete.toLowerCase().includes(nom);
            }else{
                passer_le_filtre_nom=passer_le_filtre_nom || propriete.toLowerCase()==nom;
            }
        });
    }
    //console.log(le_filtre+" "+propriete+" "+passer_le_filtre_nom)
    return passer_le_filtre_nom
}


function afficher_par_personne(){
    LayersMarker.clearLayers();
    LayermarkerClusters.clearLayers();
    // Récupération des données et affichage markers
    promise
    .then(r => {
        Circle_markers(r.features,LayersMarker);
    })
    .then(r => {
        if(btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.remove();
        }
        var btn_liste_personnes=document.createElement("button");
        btn_liste_personnes=document.getElementById("choix_affichage").appendChild(btn_liste_personnes);
        btn_liste_personnes.id="btn_liste_personnes";
        btn_liste_personnes.onclick=afficher_liste_personnes;
    })
}

function afficher_par_type(){
    LayersMarker.clearLayers();
    LayermarkerClusters.clearLayers();
    // Récupération des données et affichage markers
    promise
    .then(r => {
        markers(r.features,LayersMarker);
    }).then(r => {
        if(btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.remove();
        }
    })
}

function afficher_par_cluster(){
    LayersMarker.clearLayers();
    LayermarkerClusters.clearLayers();
    // Récupération des données et affichage markers
    promise
    .then(r => {
        CreerClusterMarkers(r.features,LayermarkerClusters);
    }).then(r => {
        if(btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.remove();
        }
    })
}




function markers(array, LayersMarker){
    count=0;
    for(var i=0; i<array.length;i++){
        let obj = array[i];
        obj.i = i
		if(passer_le_filtre(obj)){
            count+=1;
			let marker = L.marker([obj.geometry.coordinates[1],obj.geometry.coordinates[0]],{draggable:false});
			LayersMarker.addLayer(marker);
			couleur_par_type(marker,obj.properties.Type);
			//var nb = colorMarker(latSud,LayersMarker)
			//document.getElementById('nbNord').innerHTML = nb[0];
			//document.getElementById('nbSud').innerHTML = nb[1];
			popupContent = "<div class='div_photos_popup'><h3><b>"+obj.properties.Personne+"</b></h3>" + "<h4>"+obj.properties.Type+"</h4>" + "<h4>"+obj.properties.datePubli+"</h4>";
            var response={address:{}};
            if(obj.properties.com_nom){
				popupContent+="<h4>"+obj.properties.com_nom+"</h4>";
			}
            if(obj.properties.nom){
				popupContent+="<h4>"+obj.properties.nom+" ("+obj.properties.code+")</h4>";
			}
            /*
            if(!obj.properties.com_nom||!obj.properties.nom){
                Reverse_chercher(obj.geometry.coordinates[1],obj.geometry.coordinates[0],response);
                if(response.address.city){
                    obj.properties.com_nom=response.address.city;
                    popupContent+="<h4>"+response.address.city+"</h4>";
                }
                if(response.address.county){
                    obj.properties.nom=response.address.county;//Nom du département
                    popupContent+="<h4>"+response.address.county+"</h4>";
                }
            }*/
            if(obj.properties.Doublon){
                if(obj.properties.Doublon>0){
                    popupContent+="<h4>Doublon n°"+obj.properties.Doublon+"</h4>";
                }
            }	
			if(obj.properties.Notes){
				popupContent+="<h4>"+obj.properties.Notes+"</h4>";
			}
            
			if(obj.properties.lien){
				var lien=obj.properties.lien;
				if(obj.properties.lien2){
					lien+=obj.properties.lien2
				}
				if(lien.includes("video")){
                    popupContent+="<video controls src="+lien+' class="photos_popup">';
                }else{
                    popupContent+="<img src="+lien+' class="photos_popup" alt="Photo indisponible (T_T), elle sera remise d\'ici peu">';
                }
			}
            popupContent += "<button class='modif' id='modif_"+obj.i+"'></button>";
			//popupContent += carousel(obj);
			marker.bindPopup(popupContent+"</div>", {
				minWidth: 400,
			});
            marker.addEventListener("popupopen", function(event) {
                //var response={};
                //Reverse_chercher(obj.geometry.coordinates[1],obj.geometry.coordinates[0],response);
                document.getElementById("modif_"+obj.i).onclick=function(){modifier_marker(marker, obj)}
                if(obj.properties.Type=="Clou"){
                    clouLaid();
                }
                setTimeout(function(){
                    var old_width=document.getElementsByClassName("leaflet-popup")[0].clientWidth;
                    document.getElementsByClassName("leaflet-popup-content")[0].style.width=document.getElementsByClassName("div_photos_popup")[0].clientWidth+"px";
                    var new_width=document.getElementsByClassName("leaflet-popup")[0].clientWidth;
                    document.getElementsByClassName("leaflet-popup")[0].style.left=parseInt(document.getElementsByClassName("leaflet-popup")[0].style.left.replace("px",""))+(old_width-new_width)/2+"px";
                    },200);
            });
		}
        
    }
    if(count>1){
        document.getElementById("titre").innerHTML=count+" Plaques de Nivellement, Bornes Géodésiques, Clous, Géomètres Sauvages, Cibles, Orgues et autres curiosités...";
    }else{
        document.getElementById("titre").innerHTML=count+" Plaque de Nivellement, Borne Géodésique, Clou, Géomètres Sauvage, Cible, Orgue ou autre curiosité...";
    }
    
}

if(document.querySelector("body").clientWidth<1280){
    var circle_radius=7;
}else{
    var circle_radius=5;
}

function rayon_cercles(){
    var width_body=document.querySelector("body").clientWidth;
    return 5+(1696-width_body)*0.01

}
circle_radius=rayon_cercles()

function Circle_markers(array,LayersMarker){
    count=0;
    for(var i=0; i<array.length;i++){
        let obj = array[i];
        obj.i = i;
        let couleur_obj=couleur_par_nom(obj.properties.Personne)
		if(passer_le_filtre(obj)){
            count+=1;
			let marker = L.circleMarker([obj.geometry.coordinates[1],obj.geometry.coordinates[0]],{draggable:false,fill:true,fillOpacity:0.7,radius:circle_radius,weight:1,color:"#000000",fillColor:couleur_obj}).addTo(mymap);
			LayersMarker.addLayer(marker);
			popupContent = "<div class='div_photos_popup'><h3><b>"+obj.properties.Personne+"</b></h3>" + "<h4>"+obj.properties.Type+"</h4>" + "<h4>"+obj.properties.datePubli+"</h4>";
            if(obj.properties.Doublon){
                if(obj.properties.Doublon>0){
                    popupContent+="<h4>Doublon n°"+obj.properties.Doublon+"</h4>";
                }
            }	
            if(obj.properties.Notes){
				popupContent+="<h4>"+obj.properties.Notes+"</h4>";
			}
            var response={address:{}};
            if(obj.properties.com_nom){
				popupContent+="<h4>"+obj.properties.com_nom+"</h4>";
			}
            if(obj.properties.nom){
				popupContent+="<h4>"+obj.properties.nom+" ("+obj.properties.code+")</h4>";
			}
            /*
            if(!obj.properties.com_nom||!obj.properties.nom){
                Reverse_chercher(obj.geometry.coordinates[1],obj.geometry.coordinates[0],response);
                if(response.address.city){
                    obj.properties.com_nom=response.address.city;
                    popupContent+="<h4>"+response.address.city+"</h4>";
                }
                if(response.address.county){
                    obj.properties.nom=response.address.county;//Nom du département
                    popupContent+="<h4>"+response.address.county+"</h4>";
                }
            }
            */
			if(obj.properties.lien){
				var lien=obj.properties.lien;
				if(obj.properties.lien2){
					lien+=obj.properties.lien2;
				}
                if(lien.includes("video")){
                    popupContent+="<video controls src="+lien+' class="photos_popup">';
                }else{
                    popupContent+="<img src="+lien+' class="photos_popup" alt="Photo indisponible (T_T), elle sera remise d\'ici peu">';
                }
				
			}
            popupContent += "<button class='modif' id='modif_"+obj.i+"'></button>";
            popupContent+="</div>";
			//popupContent += carousel(obj);
			marker.bindPopup(popupContent, {
				minWidth: 400,
			});
            marker.addEventListener("popupopen", function(event) {
                if(button_mod=document.getElementById("modif_"+obj.i)){
                    button_mod.onclick=function(){modifier_marker(marker, obj)}
                }
                
                if(obj.properties.Type=="Clou"){
                    clouLaid();
                }
                setTimeout(function(){
                    var old_width=document.getElementsByClassName("leaflet-popup")[0].clientWidth;
                    document.getElementsByClassName("leaflet-popup-content")[0].style.width=document.getElementsByClassName("div_photos_popup")[0].clientWidth+"px";
                    var new_width=document.getElementsByClassName("leaflet-popup")[0].clientWidth;
                    document.getElementsByClassName("leaflet-popup")[0].style.left=parseInt(document.getElementsByClassName("leaflet-popup")[0].style.left.replace("px",""))+(old_width-new_width)/2+"px";
                    },200);
            });
            
		}
        
    }
    if(count>1){
        document.getElementById("titre").innerHTML=count+" Plaques de Nivellement, Bornes Géodésiques, Clous, Géomètres Sauvages, Cibles, Orgues et autres curiosités...";
    }else{
        document.getElementById("titre").innerHTML=count+" Plaque de Nivellement, Borne Géodésique, Clou, Géomètres Sauvage, Cible, Orgue ou autre curiosité...";
    }
}

function CreerClusterMarkers(array,LayermarkerClusters){
    count=0;
    for(var i=0; i<array.length;i++){
        let obj = array[i];
        let couleur_obj=couleur_par_nom(obj.properties.Personne)
		if(passer_le_filtre(obj)){
            count+=1;
			let marker = L.circleMarker([obj.geometry.coordinates[1],obj.geometry.coordinates[0]],{draggable:false,fill:true,fillOpacity:0.7,radius:circle_radius,weight:1,color:"#000000",fillColor:couleur_obj});
			LayermarkerClusters.addLayer(marker);
			popupContent = "<div class='div_photos_popup'><h3><b>"+obj.properties.Personne+"</b></h3>" + "<h4>"+obj.properties.Type+"</h4>" + "<h4>"+obj.properties.datePubli+"</h4>";
            if(obj.properties.Doublon){
                if(obj.properties.Doublon>0){
                    popupContent+="<h4>Doublon n°"+obj.properties.Doublon+"</h4>";
                }
            }	
            if(obj.properties.Notes){
				popupContent+="<h4>"+obj.properties.Notes+"</h4>";
			}
            var response={address:{}};
            if(obj.properties.com_nom){
				popupContent+="<h4>"+obj.properties.com_nom+"</h4>";
			}
            if(obj.properties.nom){
				popupContent+="<h4>"+obj.properties.nom+" ("+obj.properties.code+")</h4>";
			}
            /*
            if(!obj.properties.com_nom||!obj.properties.nom){
                Reverse_chercher(obj.geometry.coordinates[1],obj.geometry.coordinates[0],response);
                if(response.address.city){
                    obj.properties.com_nom=response.address.city;
                    popupContent+="<h4>"+response.address.city+"</h4>";
                }
                if(response.address.county){
                    obj.properties.nom=response.address.county;//Nom du département
                    popupContent+="<h4>"+response.address.county+"</h4>";
                }
            }
            */
			if(obj.properties.lien){
				var lien=obj.properties.lien;
				if(obj.properties.lien2){
					lien+=obj.properties.lien2;
				}
                if(lien.includes("video")){
                    popupContent+="<video controls src="+lien+' class="photos_popup">';
                }else{
                    popupContent+="<img src="+lien+' class="photos_popup" alt="Photo indisponible (T_T), elle sera remise d\'ici peu">';
                }
				
			}
            popupContent+="</div>";
			//popupContent += carousel(obj);
			marker.bindPopup(popupContent, {
				minWidth: 400,
			});
            marker.addEventListener("popupopen", function(event) {
                if(obj.properties.Type=="Clou"){
                    clouLaid();
                }
                setTimeout(function(){
                    var old_width=document.getElementsByClassName("leaflet-popup")[0].clientWidth;
                    document.getElementsByClassName("leaflet-popup-content")[0].style.width=document.getElementsByClassName("div_photos_popup")[0].clientWidth+"px";
                    var new_width=document.getElementsByClassName("leaflet-popup")[0].clientWidth;
                    document.getElementsByClassName("leaflet-popup")[0].style.left=parseInt(document.getElementsByClassName("leaflet-popup")[0].style.left.replace("px",""))+(old_width-new_width)/2+"px";
                    },200);
            });
            
		}
        
    }
    if(count>1){
        document.getElementById("titre").innerHTML=count+" Plaques de Nivellement, Bornes Géodésiques, Clous, Géomètres Sauvages, Cibles, Orgues et autres curiosités...";
    }else{
        document.getElementById("titre").innerHTML=count+" Plaque de Nivellement, Borne Géodésique, Clou, Géomètres Sauvage, Cible, Orgue ou autre curiosité...";
    }
}

function modifier_marker(marker, obj){
    popupContent = "<div class='div_photos_popup'><input type='text' id='mod_personne' value='"+obj.properties.Personne+"'></input>" 
    popupContent += "<input type='text' id='mod_type' value='"+obj.properties.Type+"'></input>" 
    popupContent +=  "<input type='date' id='mod_date' value='"+obj.properties.datePubli.replace("/","-").replace("/","-")+"'></input>";
    if(obj.properties.Doublon){
        popupContent+="<label>Doublon n°</label><input type='number' id='mod_doublon' value='"+obj.properties.Doublon+" min=0></input>";
    }else{
        popupContent+="<label>Doublon n°</label><input type='number' id='mod_doublon' placeholder='Nombre de repost' min=0></input>";
    }
    if(obj.properties.Notes){
        popupContent+="<input type='text' id='mod_notes' value="+obj.properties.Notes+" placeholder='Notes'></input>";
    }else{
        popupContent+="<input type='text' id='mod_notes' placeholder='Notes'></input>";
    }
    if(obj.properties.com_nom){
        popupContent+="<input type='text' id='mod_com' value="+obj.properties.com_nom+" placeholder='Nom de la commune'></input>";
    }else{
        popupContent+="<input type='text' id='mod_com' placeholder='Nom de la commune'></input>";
    }
    if(obj.properties.nom){
        popupContent+="<input type='text' id='mod_dep' value="+obj.properties.nom+"  placeholder='Nom du département'></input>";
        popupContent+="<input type='text' id='mod_code' value="+obj.properties.code+" placeholder='Code du département'></input>";
    }else{
        popupContent+="<input type='text' id='mod_dep' placeholder='Nom du département'></input>";
        popupContent+="<input type='text' id='mod_code' placeholder='Code du département'></input>";
    }
    popupContent+="<input type='file' id='file_input' placeholder='Modifier l'image' accept='image/*,video/*'>"
    if(obj.properties.lien){
        var lien=obj.properties.lien;
        if(obj.properties.lien2){
            lien+=obj.properties.lien2;
        }
        //popupContent+="<div><p class='text_drag_drop'>Glissez-déposez une image ici</p>"
        if(lien.includes("video")){
            popupContent+="<video controls id='mod_photo' src="+lien+' class="photos_popup">';
        }else{
            popupContent+="<img src="+lien+' id="mod_photo" class="photos_popup" alt="Photo indisponible (T_T), elle sera remise d\'ici peu">';
        } 
    }else{
        popupContent+="<img src='' id='mod_photo' class='photos_popup' style='border:1px solid red' alt='Ajouter une photo'>";
    }
    popupContent += "<button class='save' id='save_"+obj.i+"'></button>";
    popupContent += "<button id='deplacer_"+obj.i+"'>Déplacer</button>";
    popupContent+="</div>";
    marker.bindPopup(popupContent, {
        minWidth: 500,
    });
    marker.openPopup();
    function save(){
        obj.properties.Personne=document.getElementById("mod_personne").value;
            obj.properties.Type=document.getElementById("mod_type").value;
            obj.properties.datePubli=document.getElementById("mod_date").value.replace("-","/").replace("-","/");
            obj.properties.Doublon=document.getElementById("mod_doublon").value;
            obj.properties.Notes=document.getElementById("mod_notes").value;
            obj.properties.com_nom=document.getElementById("mod_com").value;
            obj.properties.nom=document.getElementById("mod_dep").value;
            obj.properties.code=document.getElementById("mod_code").value;
            obj.properties.lien=lien;
            obj.properties.lien2="";
            marker.closePopup();
            changer_affichage();
    }
    function listen(){
        document.getElementById("mod_photo").style.width=document.getElementsByClassName("leaflet-popup-content-wrapper")[0].clientWidth-5+"px";
        const fileInput = document.getElementById('file_input');
        fileInput.onchange = () => {
            var selectedFile = fileInput.files[0];
            console.log(selectedFile);
            form_Data = new FormData();
            form_Data.append('file', selectedFile);
            sauvegarder_image(form_Data);
            document.getElementById("mod_photo").src="plaques/"+selectedFile.name;
        }
        document.getElementById("save_"+obj.i).onclick = () => {
            ajouter_bouton_envoyer();
            modified_plaques[obj.i]=obj;
            save();
        }
        document.getElementById("deplacer_"+obj.i).onclick = () => {
            save();
            document.getElementById("Grrr").play();
	        alert("Raahh, ma plaque n'est pas à sa place !")
            document.getElementById("mapid").style.cursor="crosshair";
            mymap.addEventListener("click", function(event){
                console.log(event.latlng);
                var popup = L.popup();
                popup
                    .setLatLng(event.latlng)
                    .setContent("<button id='valider_dep'>Valider déplacement</button><button id='annuler_dep'>Annuler déplacement</button>")
                    .openOn(mymap);
                document.getElementById("valider_dep").onclick=function(){
                    popup.remove();
                    mymap.removeEventListener("click");
                    document.getElementById("mapid").style.cursor="";
                    obj.geometry.coordinates=[event.latlng.lng, event.latlng.lat];
                    modified_plaques[obj.i]=obj;
                    marker.setLatLng(event.latlng);
                    changer_affichage();
                    ajouter_bouton_envoyer();
                }
                document.getElementById("annuler_dep").onclick=function(){
                    popup.remove();
                    mymap.removeEventListener("click");
                    document.getElementById("mapid").style.cursor="";
                }
            });
        }
    }
    listen();
    marker.addEventListener("popupopen", function(event) {
        listen();
    });
}

function dragOverHandler(ev) {
    console.log('File(s) in drop zone');
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

function dropHandler(ev) {
    // Prevent default behavior (Prevent file from being opened)
    console.log(ev)
    ev.preventDefault();
    console.log('File(s) dropped');
    

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        if (ev.dataTransfer.items[0].kind === 'file') {
            file = ev.dataTransfer.items[i].getAsFile();
            console.log('... file[' + i + '].name = ' + file.name);
            }
    } else {
        // Use DataTransfer interface to access the file(s)
        file =  ev.dataTransfer.files[0];
        console.log('... file[' + i + '].name = ' + file.name);
    }
}
   

function changer_filtre(){
    filtre.nom=document.getElementById("filtreNom").value.toLowerCase();
	filtre.type=document.getElementById("filtreType").value.toLowerCase();
    filtre.date=document.getElementById("filtreDate").value.toLowerCase();
    filtre.dep=document.getElementById("filtreDep").value.toLowerCase();
}


function couleur_par_type(marker,type){
    var facteur=circle_radius/5.725
    if(type=="Plaque de Nivellement") {
        marker.setIcon(L.icon({iconUrl:"rn.png",iconSize: [facteur*40, facteur*40]}));
    }else if(type=="Borne Géodésique") {
        marker.setIcon(L.icon({iconUrl:"borne.png",iconSize: [facteur*29, facteur*34]}));
    }else if(type=="Clou") {
        marker.setIcon(L.icon({iconUrl:"clou.png",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Cible") {
        marker.setIcon(L.icon({iconUrl:"cible.jpg",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Orgue") {
        marker.setIcon(L.icon({iconUrl:"orgue.png",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Géomètres sauvages et autres curiosités"){
        marker.setIcon(L.icon({iconUrl:"geometre.png",iconSize: [facteur*30, facteur*30]}));
    }else if(type=="Plaque de l'esplanade des Invalides"){
        marker.setIcon(L.icon({iconUrl:"invalides.png",iconSize: [facteur*25, facteur*25]}));
    }else if(type=="Autres Curiosités"){
        marker.setIcon(L.icon({iconUrl:"ptInterro.png",iconSize: [facteur*25, facteur*25]}));
    }
}

function couleur_par_nom(nom){
    if(!( nom in liste_noms_couleurs)){
        liste_noms_couleurs[nom]=couleur_aleatoire();
    }
    return liste_noms_couleurs[nom];
}

function couleur_aleatoire() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}  


/*

//Récupération des objets sur le serveur
var requestURL = 'plaques.geojson';
var request = new XMLHttpRequest();
request.open('GET', requestURL);
request.responseType = 'json';
request.send();
request.onload = function() {
    plaques = request.response;
    GeoJsonLayer.addData(plaques);
}*/

// Géocodage inverse

var inputVille = document.getElementById('inputAdresse')
inputVille.addEventListener('focusout', function(event) {
    chercher();  
});

inputVille.addEventListener('keydown', (e) => {
    if (e.keyCode==13){
        chercher();
    }
});

document.getElementById("btn-recherche").onclick=chercher();

/*
zoom_par = {
    "a":31,
    "b":8,
    "c":30,
    "l":16,
    "m":20,
    "n":22
};
*/
function chercher(){
    var adresse = $("#inputAdresse").val();
    console.log(adresse)
    if(adresse != ""){
        $.ajax({
            url: "https://nominatim.openstreetmap.org/search", // URL de Nominatim
            type: 'get', // Requête de type GET
            data: "q="+adresse+"&format=json&addressdetails=1&limit=1&polygon_svg=1" // Données envoyées (q -> adresse complète, format -> format attendu pour la réponse, limit -> nombre de réponses attendu, polygon_svg -> fournit les données de polygone de la réponse en svg)
        }).done(function (response) {
            if(response != ""){
                console.log(response)
                Lat = response[0]['lat'];
                Lng = response[0]['lon'];
                /*
                a=zoom_par["a"];
                b=zoom_par["b"];
                c=zoom_par["c"];
                n=zoom_par["n"];
                l=zoom_par["l"];
                m=zoom_par["m"];*/
                bbox1 = parseFloat(response[0]['boundingbox'][0]);
                bbox2 = parseFloat(response[0]['boundingbox'][1]);
                x = (Math.abs(bbox1 - bbox2));
                zoom_level1 = parseInt(-75*x+19.5)//parseInt(c - a*(x/a)**(1/b));
                zoom_level2 = parseInt(-2.1053*x+12.2105)//parseInt(n - l*(x/l)**(1/m));
                zoom_level3 = parseInt(-0.0306*x+8.0612)
                zoom_level = Math.max(zoom_level1, zoom_level2, zoom_level3, 0);
                console.log(zoom_level)
                mymap.flyTo([Lat,Lng], zoom_level); 
            }                
        }).fail(function (error) {
            alert(error);
            console.log("fail")
        });      
    }
}

function Reverse_chercher(lat,lon,reponse){
    $.ajax({
        url: "https://nominatim.openstreetmap.org/reverse", // URL de Nominatim
        type: 'get', // Requête de type GET
        data: "lat="+lat+"&lon="+lon+"&format=json&zoom=12&addressdetails=1" // Données envoyées (lat, lon -> positions, format -> format attendu pour la réponse, zoom -> niveau de détail)
    }).done(function (response) {
        if(response != ""){
            console.log(response)
            reponse=response
        }                
    }).fail(function (error) {
        console.log(error);
        console.log("fail")
    });      
}


function clouLaid(){
    var perdu=document.createElement("div");
    perdu.innerHTML="<img class='perdu' src='ClouLaid.png'>";
    document.querySelector("body").appendChild(perdu);
   setTimeout(function(){
        perdu.remove();
    },2000);
}

function afficher_horreurs(){
    fermer_fenetres();
    var horreur=document.createElement("div");
    horreur.innerHTML="<div class='horreur'>\
                            <div id='titre_horreur'>\
                                <h2>GALERIE DE PLAQUES IMPROBABLES</h2>\
                                <button id='close'>X</button>\
                            </div>\
                            <div id='galerie'>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries' alt='Devant le MRS' src='defis/gateau.jpg'>\
                                    <p>Devant le MRS</p>\
                                </div>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries' alt='Sous le pied d\'Emmanuel' src='defis/monstre3.jpg'>\
                                    <p>Sous le pied d'Emmanuel</p>\
                                </div>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries' alt='Dans la chambre de Yohann' src='defis/monstre2.jpg'>\
                                    <p>Dans la chambre de Yohann</p>\
                                </div>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries' alt='Dans le QYAN direction Marne la vallée' src='defis/monstre1.jpg'>\
                                    <p>Dans le QYAN direction Marne la vallée</p>\
                                </div>\
                            </div>\
                        </div>";
    document.querySelector("body").appendChild(horreur);
    document.getElementById("close").onclick=function(){
        horreur.remove();
    }
}

function afficher_defi(){
    fermer_fenetres();
    var defis=document.createElement("div");
    defis.innerHTML="<div class='horreur'>\
                            <div id='titre_horreur'>\
                                <h2>Defis</h2>\
                                <button id='close'>X</button>\
                            </div>\
                            <div id='galerie'>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries_zoomables' alt='Eglise de Huest (27)' src='defis/Huet.jpg'>\
                                    <p>Pour Célestin</p>\
                                </div>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries_zoomables' alt='rue De Gaulle, Lucon (85)' src='defis/Lucon.jpg'>\
                                    <p>Pour Elliot</p>\
                                </div>\
                                <div class='div_galeries'>\
                                    <img class='photos_galeries_zoomables' alt='Mairie de Vannes-sur-Cosson (45)' src='defis/Cosson.jpg'>\
                                    <p>Pour Augustin</p>\
                                </div>\
                            </div>\
                        </div>";
    document.querySelector("body").appendChild(defis);
    document.getElementById("close").onclick=function(){
        defis.remove();
    }
    var liste=document.getElementsByClassName("photos_galeries");
    var l=liste.length;
    for(i=0;i<l;i++){
        let photo=liste.item(i);
        photo.onclick=function(){
            window.open(photo.src);
        }
    }
    
}

function fermer_fenetres(){
    stats_ouvert=false;
    var liste=document.getElementsByClassName("horreur");
    var l=liste.length;
    for(i=0;i<l;i++){
        liste.item(i).remove();
    }
}





affichage.onchange=changer_affichage;
function changer_affichage(){
    if (!en_train_de_jouer){
        console.log(affichage.value);
        if (btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.remove();
        }
        if(affichage.value=="type"){
            afficher_par_type();
        }else if(affichage.value=="personne"){
            afficher_par_personne();
        }else if(affichage.value=="cluster"){
            afficher_par_cluster();
        }
        if(document.getElementById("div_jeu_plaques")){
            lister_plaques();
        }
    }
}
document.getElementById("geodesie").onclick=function(){
    window.location.href="https://geodesie.ign.fr/fiches/index.php?module=e&action=visugeod";
}

document.getElementById("filtrer").onclick=function(){
	changer_filtre();
	if (legende=document.getElementById("legende")){
        if (btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.remove();
        }
        cacher_liste_personnes();
        setTimeout(x=>{
            changer_affichage();
            setTimeout(x=>{
                afficher_liste_personnes();
            },500);
        },1000);
    }else{
        if (btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.remove();
        }
        changer_affichage();
    }
    if(stats_ouvert){
        recreer_graphiques();
    }
}
var chgmt_filtre_nom=false;
var chgmt_filtre_type=false;
var chgmt_filtre_date=false;
var chgmt_filtre_dep=false;

document.getElementById("filtreNom").onkeydown=function(e){
    if(e.code=="Enter" || (document.getElementById("filtreNom").value.length<=1 && e.code=="Backspace"&&(chgmt_filtre_nom||chgmt_filtre_type||chgmt_filtre_date||chgmt_filtre_dep))){
        if(document.getElementById("filtreNom").value.length<=1 && e.code=="Backspace"){
            document.getElementById("filtreNom").value="";
        }
        chgmt_filtre_date=false;chgmt_filtre_type=false;chgmt_filtre_nom=false;chgmt_filtre_dep=false;
        changer_filtre();
        if (legende=document.getElementById("legende")){
            if (btn_liste_personnes=document.getElementById("btn_liste_personnes")){
                btn_liste_personnes.remove();
            }
            cacher_liste_personnes();
            setTimeout(x=>{
                changer_affichage();
                setTimeout(x=>{
                    afficher_liste_personnes();
                },500);
            },1000);
        }else{
            if (btn_liste_personnes=document.getElementById("btn_liste_personnes")){
                btn_liste_personnes.remove();
            }
            changer_affichage();
        }
        if(stats_ouvert){
            recreer_graphiques();
        }
    }else if(!document.getElementById("filtreNom").value.length==0){
        chgmt_filtre_nom=true;
    }
}


document.getElementById("filtreType").onkeydown=function(e){
    if(e.code=="Enter" || (document.getElementById("filtreType").value.length<=1 && e.code=="Backspace" &&(chgmt_filtre_nom||chgmt_filtre_type||chgmt_filtre_date||chgmt_filtre_dep))){
        if(document.getElementById("filtreType").value.length<=1 && e.code=="Backspace"){
            document.getElementById("filtreType").value="";
        }
        chgmt_filtre_date=false;chgmt_filtre_type=false;chgmt_filtre_nom=false;chgmt_filtre_dep=false;
        changer_filtre();
	    changer_affichage();
        if(stats_ouvert){
            recreer_graphiques();
        }
    }else if(!document.getElementById("filtreType").value.length==0){
        chgmt_filtre_type=true;
    } 
}
document.getElementById("filtreDate").onkeydown=function(e){
    if(e.code=="Enter" || (document.getElementById("filtreDate").value.length<=1 && e.code=="Backspace" &&(chgmt_filtre_nom||chgmt_filtre_type||chgmt_filtre_date||chgmt_filtre_dep))){
        if(document.getElementById("filtreDate").value.length<=1 && e.code=="Backspace"){
            document.getElementById("filtreDate").value="";
        }
        chgmt_filtre_date=false;chgmt_filtre_type=false;chgmt_filtre_nom=false;chgmt_filtre_dep=false;
        changer_filtre();
	    changer_affichage();
        if(stats_ouvert){
            recreer_graphiques();
        }
    }else if(!document.getElementById("filtreDate").value.length==0){
        chgmt_filtre_date=true;
    }  
}
document.getElementById("filtreDep").onkeydown=function(e){
    if(e.code=="Enter" || (document.getElementById("filtreDep").value.length<=1 && e.code=="Backspace" &&(chgmt_filtre_nom||chgmt_filtre_type||chgmt_filtre_date||chgmt_filtre_dep))){
        if(document.getElementById("filtreDep").value.length<=1 && e.code=="Backspace"){
            document.getElementById("filtreDep").value="";
        }
        chgmt_filtre_date=false;chgmt_filtre_type=false;chgmt_filtre_nom=false;chgmt_filtre_dep=false;
        changer_filtre();
	    changer_affichage();
        if(stats_ouvert){
            recreer_graphiques();
        }
    }else if(!document.getElementById("filtreDep").value.length==0){
        chgmt_filtre_dep=true;
    } 
}


document.getElementById("ajouter_plaque").onclick=function(){
    document.getElementById("mapid").style.cursor="crosshair";
    mymap.addEventListener("click", function(event){
        console.log(event.latlng);
        var popupContent = "<div class='div_photos_popup'><input type='text' id='mod_personne' placeholder='Personne'></input>" 
        popupContent += "<input type='text' id='mod_type' placeholder='Type'></input>" 
        popupContent +=  "<input type='date' id='mod_date' placeholder='Date de publication'></input>";
        popupContent+="<label>Doublon n°</label><input type='number' id='mod_doublon' placeholder='Nombre de repost' min=0></input>";
        popupContent+="<input type='text' id='mod_notes' placeholder='Notes'></input>";
        popupContent+="<input type='text' id='mod_com' placeholder='Nom de la commune'></input>";
        popupContent+="<input type='text' id='mod_dep' placeholder='Nom du département'></input>";
        popupContent+="<input type='text' id='mod_code' placeholder='Code du département'></input>";
        popupContent+="<input type='file' id='file_input' placeholder='Modifier l'image' accept='image/*,video/*'>"
        popupContent+="<img src='' id='mod_photo' class='photos_popup' style='border:1px solid red' alt='Ajouter une photo'>";
        popupContent += "<button id='confirm_ajout'>Ajouter plaque</button>";
        popupContent+="</div>";
        var lien="";
        var popup = L.popup();
        popup
            .setLatLng(event.latlng)
            .setContent(popupContent)
            .openOn(mymap);
        function listen(){
            document.getElementById("mod_photo").style.width=document.getElementsByClassName("leaflet-popup-content-wrapper")[0].clientWidth-5+"px";
            const fileInput = document.getElementById('file_input');
            fileInput.onchange = () => {
                selectedFile = fileInput.files[0];
                console.log(selectedFile);
                //lien = window.URL.createObjectURL(selectedFile);
                //lien = URL.createObjectURL(selectedFile);
                form_Data = new FormData();
                form_Data.append('file', selectedFile);
                sauvegarder_image(form_Data);
                lien = "plaques/"+selectedFile.name;
                document.getElementById("mod_photo").src="plaques/"+selectedFile.name;
                
            }
            document.getElementById("confirm_ajout").onclick = () => {
                ajouter_plaque(event.latlng, lien);
                popup.remove();
                mymap.removeEventListener("click");
                document.getElementById("mapid").style.cursor="";
                
            }
        }
        listen();
    });
}

function ajouter_plaque(latlng, lien){
    var obj = {
        "type": "Feature",
        "properties": {
            "Personne":document.getElementById("mod_personne").value,
            "Type":document.getElementById("mod_type").value,
            "datePubli":document.getElementById("mod_date").value.replace("-","/").replace("-","/"),
            "Notes":document.getElementById("mod_notes").value,
            "lien":lien,
            "lien2": null,
            "code":document.getElementById("mod_code").value,
            "nom":document.getElementById("mod_dep").value,
            "com_nom":document.getElementById("mod_com").value,
            "Doublon":document.getElementById("mod_doublon").value
        }, "geometry": {
             "type": "Point",
             "coordinates": [ latlng.lng, latlng.lat ] 
        }
    }
    json_plaques.features.push(obj);
    modified_plaques[json_plaques.features.length-1]=obj;
    changer_affichage();
    ajouter_bouton_envoyer();
}

var exist_bouton_envoyer=false;
function ajouter_bouton_envoyer(){
    if(!exist_bouton_envoyer){
        exist_bouton_envoyer=true;
        var bouton_envoyer = document.createElement("button")
        bouton_envoyer.id="bouton_envoyer";
        //bouton_envoyer.innerHTML="Envoyer mes modifications à l'administrateur";
        bouton_envoyer.innerHTML="Envoyer mes modifications au serveur";
        bouton_envoyer = document.getElementById("boutons_milieu_bas").appendChild(bouton_envoyer);
        bouton_envoyer.onclick=function(){
            var renseignement = document.createElement("div");
            //renseignement.innerHTML="<h2>Envoyer mes modifications à l'administrateur</h2>"
            renseignement.innerHTML="<h2>Envoyer mes modifications au serveur</h2>"
            renseignement.innerHTML+="<input type='text' id='username' placeholder='Votre nom'></input>"
            renseignement.innerHTML+="<textarea id='commentaires' style='width: 70%' placeholder='Commentaires sur vos modifications pour le très grand gourou'></textarea>"
            renseignement.innerHTML+="<label style='padding-left: 10px;'>Je promets que je ne suis pas en train de faire n'importe quoi<input type='checkbox' id='validation_check'>"
            renseignement.innerHTML+="<button id='envoyer_admin'>Envoyer</button>"
            renseignement.innerHTML+="<button id='annuler_envoi'>Annuler</button>"
            renseignement = document.querySelector("body").appendChild(renseignement)
            renseignement.id = "renseignement";
            document.getElementById('envoyer_admin').onclick=function(){
                if(document.getElementById("validation_check").checked){
                    //sauvegarde
                    var data = 'type=sauvegarder_plaques&data='+JSON.stringify(json_plaques)
                    console.log(data)
                    fetch('php/sauvegarde_plaques.php', {
                        method: 'post',
                        body: data,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                        }).then(r=>{
                            console.log("Plaque sauvegardée")
                            renseignement.remove();
                        })

                }else{
                    alert("C'est pas bien de faire n'importe quoi !")
                }
                /*
                if(document.getElementById("username").value){
                    alert("Cher ou chère "+document.getElementById('username').value+", cette fonctionalité n'est malheureusement pas encore disponible ! Toutes nos excuses ! Vous pouvez néanmoins nous envoyer un courriel de réclamation. Si vous avez ajouté des photos, n'oubliez pas de les mettre en pièce-jointe.")
                  }else{
                    alert("Cette fonctionalité n'est malheureusement pas encore disponible ! Toutes nos excuses ! Vous pouvez néanmoins nous envoyer un courriel de réclamation. Si vous avez ajouté des photos, n'oubliez pas de les mettre en pièce-jointe.")
                  }
                var yourMessage = "Salut Ô très grand Gourou !\n Tu as vraiment fait n'importe quoi sur ton site moisi, on est obligé de tout faire nous même !\n";
                yourMessage+=document.getElementById('commentaires').value+"\n";
                yourMessage+=JSON.stringify(modified_plaques)+"\n";
                yourMessage+="Bisous bisous !"
                window.open("mailto:martin.cubaud@ensg.eu?subject="
                + encodeURIComponent("Modifications de Plaques de Nivellement, Bornes Géodésiques, Clous, Géomètres Sauvages, Cibles, Orgues et autres curiosités...")
                + "&body=" + encodeURIComponent(yourMessage));
                renseignement.remove()
                */
            }
            document.getElementById("annuler_envoi").onclick=function(){
                renseignement.remove();
            }
        }
    }
}

function sendMail()
{
    var yourMessage = document.getElementById("message").value;
    var subject = document.getElementById("selectList").value;
    document.location.href = "mailto:chrisgreg23@googlemail.com?subject="
        + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(yourMessage);
}




document.getElementById("logo").onclick=afficher_horreurs;

document.getElementById("defi").onclick=afficher_defi;

document.getElementById("Quitter").addEventListener("click",e=>{
    window.location.href="..";
});

var circle;

function jouer(objectif,plaque_aleatoire){
    var popup = L.popup();
    function onMapClick(e) {
        KNN_estimation(e.latlng);
        if(document.getElementById("valider_click")){
            document.getElementById("valider_click").remove();
        }
        popup
            .setLatLng(e.latlng)
            .setContent("Vous avez cliqué en " + e.latlng.toString()+"<div id='proba'></div><button id='valider_click'>Valider</button>")
            .openOn(mymap);
        document.getElementById("valider_click").onclick=function(){
            var distance=Math.round(L.CRS.EPSG4326.distance(objectif,e.latlng));
            var pts_gagnes=Math.min(Math.round(Math.max(1100/(4*13.333333)*(6-(Math.log(distance)/Math.log(10))**2/6),0)),100);
            couleur=couleur_par_score(pts_gagnes);
            circle=L.circle(objectif,{radius:distance, color:couleur }).addTo(mymap);
            score+=pts_gagnes;
            alert("distance : "+distance/1000+" km\n points gagnés : "+pts_gagnes+"\nSCORE : "+score);
            document.getElementById('score').innerHTML=" SCORE : "+score;
            dist_moy=(nombre_plaques_cherchees*dist_moy+distance/1000)/(nombre_plaques_cherchees+1);
            document.getElementById('dist_moy').innerHTML="Distance moyenne : "+dist_moy+" km";
            Circle_markers([plaque_aleatoire],LayersMarker);
            circle.remove();
            popup.remove();
            mymap.removeEventListener('click');
            nombre_plaques_cherchees+=1;
            if(nombre_plaques_cherchees<nombre_de_plaques_a_chercher){
                chercher_plaque_aleatoire();
            }else{
                if(document.getElementById("tada")){
                    document.getElementById("tada").play();
                }
                if(score>highscore_plaques){
                    highscore_plaques=score;
                    localStorage.setItem("highscore_plaques",highscore_plaques);
                }
                alert("VICTOIRE !\n"+"\nSCORE : "+score+"\nDistance moyenne : "+dist_moy+" km"+"\nHighscore : "+highscore_plaques)
                en_train_de_jouer=false;
                document.getElementById("mapid").style.cursor="";
                document.getElementById("bas_gauche").childNodes[1].childNodes[1].style.cursor="";
                if(bouton_liste=document.getElementById("bas_gauche").childNodes[1].childNodes[3]){
                    bouton_liste.style.cursor="";
                }
                document.getElementById("Bouton_jouer").style.cursor="";
                document.getElementById("div_jeu_plaques").remove();
                document.getElementById("ecran_du_jeu").style.gridTemplateColumns="100%";
                changer_affichage();
            }
        }
    }
    
    
    mymap.addEventListener('click', onMapClick);
}
function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
function hexToRgb(hex){
    var r=parseInt(hex.slice(1,3),16);
    var g=parseInt(hex.slice(3,5),16);
    var b=parseInt(hex.slice(5,7),16);
    return [r,g,b]
}
function couleur_par_score(pts){
    return rgbToHex(Math.floor(255-2.55*pts),Math.floor(2.55*pts),0);
}
var liste_plaques;
var liste_plaques_tirees;
var nb_plaques;
var score=0;
var dist_moy=0;
var nombre_plaques_cherchees=0;
var nombre_de_plaques_a_chercher=10;

function jeu_des_plaques(){
    cacher_liste_personnes();
    document.getElementById("mapid").style.cursor="crosshair";
    document.getElementById("bas_gauche").childNodes[1].childNodes[1].style.cursor="not-allowed";
    if(btn_liste_personnes=document.getElementById("bas_gauche").childNodes[1].childNodes[3]){
        btn_liste_personnes.style.cursor="not-allowed";
    }
    document.getElementById("Bouton_jouer").style.cursor="not-allowed";
    en_train_de_jouer=true;
    document.getElementById("ecran_du_jeu").style.gridTemplateColumns="1fr 20%";
    if(document.getElementById("div_jeu_plaques")){
        document.getElementById("div_jeu_plaques").remove()
    }

    div_infos_plaques=document.createElement("div");
    div_infos_plaques.id='div_jeu_plaques';
    div_infos_plaques.innerHTML="<h2>Jeu des Plaques</h2><div id='div_infos_plaques'></div><div id='Resultats'><p id='score'>SCORE : 0</p><p id='dist_moy'>Distance moyenne : 0</p></div>"
    document.getElementById("ecran_du_jeu").appendChild(div_infos_plaques);
    document.getElementById("div_jeu_plaques").style.maxHeight=document.getElementById("div_jeu_plaques").clientHeight+"px";
    LayersMarker.clearLayers();
    LayermarkerClusters.clearLayers();
    liste_plaques_tirees=[];
    promise
    .then(r => {
        score=0;
        dist_moy=0;
        nombre_plaques_cherchees=0;
        liste_plaques=r.features;
        nb_plaques=liste_plaques.length;
        chercher_plaque_aleatoire();
    });
}

function chercher_plaque_aleatoire(tentatives=0){
    if (tentatives<10000){
        var numero_plaque_aleatoire=Math.floor(nb_plaques*Math.random())
        var plaque_aleatoire=liste_plaques[numero_plaque_aleatoire];
        if (passer_le_filtre(plaque_aleatoire) & !(liste_plaques_tirees.includes(numero_plaque_aleatoire))){
            liste_plaques_tirees.push(numero_plaque_aleatoire);
            div_infos_plaques=document.getElementById("div_infos_plaques");
            div_infos_plaques.innerHTML="<h3><b>Plaque "+(nombre_plaques_cherchees+1)+"/"+nombre_de_plaques_a_chercher+"</b></h3>";
            if(personne_checked){
                div_infos_plaques.innerHTML+="<h4><b>"+plaque_aleatoire.properties.Personne+"</b></h4>";
            }
            if(type_checked){
                div_infos_plaques.innerHTML+="<h4>"+plaque_aleatoire.properties.Type+"</h4>" ;
            }
            if(date_checked){
                div_infos_plaques.innerHTML+="<h4>"+plaque_aleatoire.properties.datePubli+"</h4>";
            }
            if(plaque_aleatoire.properties.com_nom && com_checked){
				div_infos_plaques.innerHTML+="<h4>"+plaque_aleatoire.properties.com_nom+"</h4>";
			}
            if(plaque_aleatoire.properties.nom && dep_checked){
				div_infos_plaques.innerHTML+="<h4>"+plaque_aleatoire.properties.nom+" ("+plaque_aleatoire.properties.code+")</h4>";
			}
            if(plaque_aleatoire.properties.Notes && notes_checked){
				div_infos_plaques.innerHTML+="<h4>"+plaque_aleatoire.properties.Notes+"</h4>";
			}
			if(plaque_aleatoire.properties.lien && photo_checked){
				var lien=plaque_aleatoire.properties.lien;
				if(plaque_aleatoire.properties.lien2){
					lien+=plaque_aleatoire.properties.lien2;
				}
                if(lien.includes("video")){
                    div_infos_plaques.innerHTML+="<video controls src="+lien+' class="photos_popup">';
                }else{
                    div_infos_plaques.innerHTML+="<img src="+lien+' class="photos_popup" alt="Photo indisponible (T_T), elle sera remise d\'ici peu">';
                }
				
			}
            console.log([plaque_aleatoire.geometry.coordinates[1],plaque_aleatoire.geometry.coordinates[0]]);
            jouer(L.latLng(plaque_aleatoire.geometry.coordinates[1],plaque_aleatoire.geometry.coordinates[0]),plaque_aleatoire);
        }else if(en_train_de_jouer){
            chercher_plaque_aleatoire(tentatives+1);
        }
    }else{
        en_train_de_jouer=false;
        alert("Aucune nouvelle plaque ne correspond à celles demandées par le filtre. Pensez à vérifier l'orthographe.");
        fin_premature();
    }
    
    
}

function afficher_liste_personnes(){
    if(!en_train_de_jouer){
        var legende=document.createElement("div");
        legende.innerHTML="<div id='haut_legende'><button id='reset_legende'></button><h3>Légende</h3><button id='fermer_legende'>X</button></div>";
        legende.innerHTML+="<div id='div_slider_rayon'><h4>Rayon Icones</h4><input type='range' class='slider' id='slider_rayon' min="+0+" max="+20+" value="+circle_radius+"></input></label></div>"
        legende.innerHTML+="<div id='legende_scroll'>";
        legende.innerHTML+="</div>"
        legende=document.querySelector("body").appendChild(legende);
        legende.id="legende";
        var legende_scroll=document.getElementById("legende_scroll")
        var liste_noms = [];
        for (let nom in liste_noms_couleurs){
            liste_noms.push(nom);
        }
        liste_noms.sort()
        liste_noms.forEach(nom=>{
                legende_scroll.innerHTML+="<div class='element_liste'>\
                    <div class='pitiron' id='couleur_"+nom+"' style='background-color: "+liste_noms_couleurs[nom]+";'></div><p>"+nom+"</p><input type='checkbox' id='checkbox_"+nom+"'></input>\
                </div>";
            }
        )

        liste_noms.forEach(nom=>{
            nom_ok = nom.replace("'", "_");
            document.getElementById('couleur_'+nom).personne=nom;
            document.getElementById('couleur_'+nom).onclick=changer_couleur;
            var coche=filtre_avec_separateur(filtre.nom,nom);
            document.getElementById("checkbox_"+nom).checked=coche;
            document.getElementById("checkbox_"+nom).onchange=filtrer_checkbox;
        })
        legende.style.width=document.getElementById("bas_gauche").clientWidth+"px";
        legende.style.bottom=document.getElementById("recherche").clientHeight+4+"px";
        document.getElementById("btn_liste_personnes").onclick=cacher_liste_personnes;
        document.getElementById("fermer_legende").onclick=cacher_liste_personnes;
        document.getElementById("reset_legende").onclick=reset_legende;
        document.getElementById('slider_rayon').onchange=function(){
            circle_radius=document.getElementById('slider_rayon').value;
            changer_affichage();
        }
    }
}

function cacher_liste_personnes(){
    if (legende=document.getElementById("legende")){
        legende.style.animation="partir 1s ease";
    }
    setTimeout(x=>{
        if (legende=document.getElementById("legende")){
            legende.remove();
        }
        if (btn_liste_personnes=document.getElementById("btn_liste_personnes")){
            btn_liste_personnes.onclick=afficher_liste_personnes;
        }
    },1000);
    
}

function changer_couleur(e){
    var nom=e.target.personne;
    var couleur=liste_noms_couleurs[nom];
    [r,g,b]=hexToRgb(couleur);
    choix_couleur=document.createElement("div");
    choix_couleur.innerHTML+="<div><h2>Choix de la couleur de "+nom+"</h2></div>";
    choix_couleur.innerHTML+="<div class='line_color'><label>Rouge<input type='range' class='slider' id='red' min='0' max='255' value="+r+"></input></label><p id='r_value'>"+r+"</p></div>";
    choix_couleur.innerHTML+="<div class='line_color'><label>Vert<input type='range' class='slider' id='green' min='0' max='255' value="+g+"></input></label><p id='g_value'>"+g+"</p></div>";
    choix_couleur.innerHTML+="<div class='line_color'><label>Bleu<input type='range' class='slider' id='blue' min='0' max='255' value="+b+"></input></label><p id='b_value'>"+b+"</p></div>";
    choix_couleur.innerHTML+="<div id='echantillon' class='pitiron' style='background-color:"+couleur+";width:35px;height:35px;cursor:auto;border:1px solid black'></div>";
    choix_couleur.innerHTML+="<div id='btns_couleur'><button id='random'></button><button id='valider_changer_couleur'>Valider</button></div>";
    legende=document.querySelector("body").appendChild(choix_couleur);
    document.getElementById('red').onchange=bouger_curseurs_couleur;
    document.getElementById('green').onchange=bouger_curseurs_couleur;
    document.getElementById('blue').onchange=bouger_curseurs_couleur;
    choix_couleur.id="choix_couleur";
    document.getElementById("choix_couleur").style.left=document.getElementById("choix_couleur").offsetLeft-200+"px";
    document.getElementById("choix_couleur").style.top=document.getElementById("choix_couleur").offsetTop-200+"px";
    document.getElementById('valider_changer_couleur').personne=nom;
    document.getElementById('valider_changer_couleur').onclick=valider_changement_couleur;
    document.getElementById("random").onclick=mettre_couleur_aleatoire;
}

function bouger_curseurs_couleur(){
    var r= parseInt(document.getElementById('red').value);
    var g= parseInt(document.getElementById('green').value);
    var b= parseInt(document.getElementById('blue').value);
    couleur=rgbToHex(r,g,b);
    document.getElementById('r_value').innerHTML=r;
    document.getElementById('g_value').innerHTML=g;
    document.getElementById('b_value').innerHTML=b;
    document.getElementById('echantillon').style.backgroundColor=couleur;

}

function valider_changement_couleur(e){
    var nom=e.target.personne;
    var r= parseInt(document.getElementById('red').value);
    var g= parseInt(document.getElementById('green').value);
    var b= parseInt(document.getElementById('blue').value);
    couleur=rgbToHex(r,g,b);
    liste_noms_couleurs[nom]=couleur;
    document.getElementById("choix_couleur").remove();
    if(!en_train_de_jouer){
        afficher_par_personne();
    }
    if(couleur_nom=document.getElementById("couleur_"+nom)){
        couleur_nom.style.backgroundColor=couleur;
    }
}

function mettre_couleur_aleatoire(){
    document.getElementById("random").style.animation="0.3s ease secouer";
    var r=Math.floor(255*Math.random());
    var g=Math.floor(255*Math.random());
    var b=Math.floor(255*Math.random());
    couleur=rgbToHex(r,g,b);
    document.getElementById('red').value=r;
    document.getElementById('green').value=g;
    document.getElementById('blue').value=b;
    document.getElementById('r_value').innerHTML=r;
    document.getElementById('g_value').innerHTML=g;
    document.getElementById('b_value').innerHTML=b;
    document.getElementById('echantillon').style.backgroundColor=couleur;
    setTimeout(x=>{
        document.getElementById("random").style.animation="";
    },1000)
}

function reset_legende(){
    if(btn_liste_personnes=document.getElementById("btn_liste_personnes")){
        btn_liste_personnes.remove();
    }
    cacher_liste_personnes();
    setTimeout(x=>{
        liste_noms_couleurs={};
        changer_affichage();
        setTimeout(x=>{
            afficher_liste_personnes();
        },500);
    },1000);
    
    
}

function fin_premature(){  
    document.getElementById("mapid").style.cursor="";
    document.getElementById("bas_gauche").childNodes[1].childNodes[1].style.cursor="";
    if(btn_liste_personnes=document.getElementById("bas_gauche").childNodes[1].childNodes[3]){
        btn_liste_personnes.style.cursor="not-allowed";
    }
    document.getElementById("Bouton_jouer").style.cursor="";
    changer_affichage();
    document.getElementById("div_jeu_plaques").remove();
    document.getElementById("ecran_du_jeu").style.gridTemplateColumns="100%";
    nombre_plaques_cherchees=nombre_de_plaques_a_chercher;
    alert("Fin prématurée de la partie !\n"+"\nSCORE : "+score+"\nDistance moyenne : "+dist_moy+" km");
}

document.getElementById("Bouton_jouer").onclick=menu_jeu_des_plaques;

function menu_jeu_des_plaques(){
    if(!en_train_de_jouer){
        fermer_fenetres();
        var menu_jeu=document.createElement("div");
        var nb_value=Math.min(10,count);
        menu_jeu.id="menu_jeu";
        menu_jeu.className="horreur";
        menu_jeu.innerHTML="<div id='titre_horreur'>\
                                <div><h2 style='margin-bottom: 10px;'>Jeu des Plaques</h2>\
                                <p style='text-align: center;margin: 2px;'>(Vous pouvez utiliser le filtre en bas à droite)</p></div>\
                                <button id='close'>X</button>\
                            </div>\
                            <div id='choix_indices'>\
                                <h3>Informations à afficher si disponibles</h3>\
                                <div>\
                                <label>Personne<input type='checkbox' id='check_personne' checked></label>\
                                <label>Date<input type='checkbox' id='check_date' checked></label>\
                                <label>Type<input type='checkbox' id='check_type' checked></label>\
                                <label>Photo<input type='checkbox' id='check_photo' checked></label>\
                                <label>Département<input type='checkbox' id='check_dep'></label>\
                                <label>Commune<input type='checkbox' id='check_com'></label>\
                                <label>Notes<input type='checkbox' id='check_notes' checked></label>\
                                </div>\
                                <label>Nombre de plaques à chercher<input type='number' id='input_nb' min='1' value='"+nb_value+"' max='"+count+"'></label>\
                                <p>Certaines plaques peuvent ne pas être à leur place si je ne les ai pas trouvées ou si je me suis trompé. Dans ce cas, n'hésitez pas à m'envoyer un message ou à appuyer sur le bouton râler !</p>\
                                <div><button id='valider_menu'>Valider</button></div>\
                            </div>\
        ";
        document.querySelector("body").appendChild(menu_jeu);
        document.getElementById("close").onclick=function(){
            menu_jeu.remove();
        }
        document.getElementById('valider_menu').onclick=function(){
            personne_checked=document.getElementById("check_personne").checked;
            date_checked=document.getElementById("check_date").checked;
            type_checked=document.getElementById("check_type").checked;
            photo_checked=document.getElementById("check_photo").checked;
            dep_checked=document.getElementById("check_dep").checked;
            com_checked=document.getElementById("check_com").checked;
            notes_checked=document.getElementById("check_notes").checked;
            nombre_de_plaques_a_chercher=document.getElementById("input_nb").value;
            menu_jeu.remove();
            jeu_des_plaques();
        }
    }
    
}


function filtrer_checkbox(){
    var string_filtre_nom="!";
    var count=0;
    for (let nom in liste_noms_couleurs){
        if(!document.getElementById('checkbox_'+nom)||!document.getElementById('checkbox_'+nom).checked){
            if(count>0){
                string_filtre_nom+="|";
            }
            count+=1;
            string_filtre_nom+=nom;
        }
    }
    if(count==0){
        string_filtre_nom="";
    }
    document.getElementById("filtreNom").value=string_filtre_nom;
    changer_filtre();
    changer_affichage();
    if(stats_ouvert){
        recreer_graphiques();
    }
}




document.getElementById("statistiques").onclick=afficher_statistiques;
function afficher_statistiques(){
    if(!en_train_de_jouer){
        fermer_fenetres();
        stats_ouvert=true;
        var div_stats=document.createElement("div");
        div_stats.id="div_stats";
        div_stats.className="horreur";
        div_stats.innerHTML="<div id='titre_horreur'>\
                            <div><h2 style='margin-bottom: 10px;'>Statistiques</h2>\
                            <p style='text-align: center;margin: 2px;'>(Vous pouvez utiliser le filtre en bas à droite)</p></div>\
                            <button id='close'>X</button>\
                            </div>\
                            <div id='graphiques'>\
                                <canvas id='myChart'></canvas>\
                                <canvas id='myChart2'></canvas>\
                                <canvas id='chart_mois'></canvas>\
                                <canvas id='chart_type'></canvas>\
                                <canvas id='chart_dep'></canvas>\
                                <canvas id='chart_cumule_par_jour'></canvas>\
                                <canvas id='chart_filiere'></canvas>\
                                <img src='secte.jpg' style='width:inherit'></img>\
                            </div>\
";
        document.querySelector("body").appendChild(div_stats);
        document.getElementById("close").onclick=function(){
            div_stats.remove();
        }
        creer_graphiques();

    }
}

function creer_graphiques(){
    var compte_par_nom={};
    var compte_par_date={};
    var compte_par_mois={};
    var compte_par_type={};
    var compte_par_dep={};
    var compte_par_filieres={};
    var liste_nom=[];
    var liste_date=[];
    var liste_mois=[];
    var liste_type=[];
    var liste_dep=[];
    var liste_filieres=[];
    promise
    .then(r => {
        var array=r.features;
        for(var i=0; i<array.length;i++){
            var obj=array[i];
            if(passer_le_filtre(obj)){
                var nom=obj.properties.Personne;
                var date=obj.properties.datePubli;
                var type=obj.properties.Type;
                if(nom in filières){
                    var filiere = filières[nom];
                }else{
                    var filiere = "autre/inconnue";
                }

                if ( !(nom in compte_par_nom)){
                    compte_par_nom[nom]=1;
                    liste_nom.push(nom);
                }else{
                    compte_par_nom[nom]=compte_par_nom[nom]+1;
                }

                if ( !(type in compte_par_type)){
                    compte_par_type[type]=1;
                    liste_type.push(type);
                }else{
                    compte_par_type[type]=compte_par_type[type]+1;
                }

                if(date!=null){
                    if ( !(date in compte_par_date)){
                        compte_par_date[date]=1;
                        liste_date.push(date);
                    }else{
                        compte_par_date[date]=compte_par_date[date]+1;
                    }
                    mois=date.substring(0,7)+"/01";
                    if ( !(mois in compte_par_mois)){
                        compte_par_mois[mois]=1;
                        liste_mois.push(mois);
                    }else{
                        compte_par_mois[mois]=compte_par_mois[mois]+1;
                    }
                }

                if (!(filiere in compte_par_filieres)){
                    compte_par_filieres[filiere]=1;
                    liste_filieres.push(filiere);
                }else{
                    compte_par_filieres[filiere]=compte_par_filieres[filiere]+1;
                }

                
                if(dep=obj.properties.nom){
                    if (dep in compte_par_dep){
                        compte_par_dep[dep]+=1;
                    }else{
                        compte_par_dep[dep]=1;
                        liste_dep.push(dep)
                    }
                }
            }
        }
        var labels=[];
        var valeurs=[];
        var backgroundColor=[];
        liste_nom.sort();
        liste_nom.forEach(nom=>{
            labels.push(nom);
            valeurs.push(compte_par_nom[nom]);
            backgroundColor.push(couleur_par_nom(nom));
        })
        var data = {
            labels: labels,
            datasets: [{
            label: 'Contributions',
            backgroundColor: backgroundColor,//'rgb(190, 190, 245)',
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs,
            }]
        };
        log_scale = {
            y: {
                type: 'logarithmic'
            }
        }
        lin_scale = {
            y: {
                type: 'linear'
            }
        }
        function changer_scale(chart){
            if (chart.lin_scale){
                chart.lin_scale=false;
                chart.config._config.options.scales.y.type='linear';
                chart.update();
            }else{
                chart.lin_scale=true;
                chart.config._config.options.scales.y.type='logarithmic';
                chart.update();
            }
        }

        var config = {
            type: 'bar',
            data: data,
            options: {
                minBarLength:2,
                plugins:{
                    title:{
                        display:true,
                        text:'Contributions par personne'
                    },
                    legend:{
                        display:false
                    },
                },
                scales: lin_scale,
                datasets:{
                    bar:{
                        //minBarLength:50
                    }
                }
            }
        };
        myChart = new Chart(
            document.getElementById('myChart'),
            config
        );
        myChart.lin_scale = true;
        document.getElementById('myChart').onclick=function(){changer_scale(myChart)};


        labels=[];
        valeurs=[];
        var compte_jour_precedent=0;
        valeurs_cumulees=[];
        liste_date.sort();
        liste_date.forEach(date=>{
            var time=new Date(date);
            labels.push(time.getTime())
            valeurs.push(compte_par_date[date])
            compte_jour_precedent=compte_jour_precedent+compte_par_date[date];
            valeurs_cumulees.push(compte_jour_precedent);
        })
        data = {
            labels: labels,
            datasets: [{
            label: 'Contributions',
            backgroundColor: 'rgb(190, 190, 245)',
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs,
            }]
        };
        config = {
            type: 'line',
            data: data,
            options: {
                scales: {
                    x:{
                        type:'linear',
                        ticks:{
                            callback: function(value,index,values){
                                var time=new Date(value);
                                var jour = time.getDate();
                                var mois=time.getMonth()+1;
                                var annee=time.getFullYear();
                                return ""+jour+"/"+mois+"/"+annee;
                            }
                        }
                    },
                    y:{
                        type:'linear'
                    }
                },
                plugins:{
                    tooltip:{
                        callbacks:{
                            title: function(context){
                                var time=new Date(liste_date[context[0].dataIndex])
                                var jour = time.getDate();
                                var mois=time.getMonth()+1;
                                var annee=time.getFullYear();
                                return ""+jour+"/"+mois+"/"+annee;
                            }
                        }
                    },
                    title:{
                        display:true,
                        text:"Contributions par jour"
                    },
                    legend:{
                        display:false
                    }
                }
            }
        };
        myChart2 = new Chart(
            document.getElementById('myChart2'),
            config
        );
        myChart2.lin_scale = true;
        document.getElementById('myChart2').onclick=function(){changer_scale(myChart)};
        data = {
            labels: labels,
            datasets: [{
            label: "Contributions cumulées jusqu'à cette date",
            backgroundColor: 'rgb(190, 190, 245)',
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs_cumulees,
            }]
        };
        config = {
            type: 'line',
            data: data,
            options: {
                scales: {
                    x:{
                        type:'linear',
                        ticks:{
                            callback: function(value,index,values){
                                var time=new Date(value);
                                var jour = time.getDate();
                                var mois=time.getMonth()+1;
                                var annee=time.getFullYear();
                                return ""+jour+"/"+mois+"/"+annee;
                            }
                        }
                    },
                    y:{
                        type:'linear'
                    }
                },
                plugins:{
                    tooltip:{
                        callbacks:{
                            title: function(context){
                                var time=new Date(liste_date[context[0].dataIndex])
                                var jour = time.getDate();
                                var mois=time.getMonth()+1;
                                var annee=time.getFullYear();
                                return ""+jour+"/"+mois+"/"+annee;
                            }
                        }
                    },
                    title:{
                        display:true,
                        text:"Contributions cumulées par jour"
                    },
                    legend:{
                        display:false
                    }
                }
            }
        };
        myChart3 = new Chart(
            document.getElementById('chart_cumule_par_jour'),
            config
        );
        myChart3.lin_scale = true;
        document.getElementById('chart_cumule_par_jour').onclick=function(){changer_scale(myChart3)};

        var noms_des_mois=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"]
        labels=[];
        valeurs=[];
        liste_mois.sort();
        liste_mois.forEach(date=>{
            var time=new Date(date);
            labels.push(time.getTime())
            valeurs.push(compte_par_mois[date])
        })
        data = {
            labels: labels,
            datasets: [{
            label: 'Contributions',
            backgroundColor: 'rgb(190, 190, 245)',
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs,
            }]
        };
        config = {
            type: 'bar',
            data: data,
            options: {
                scales: {
                    x:{
                        type:'linear',
                        ticks:{
                            callback: function(value,index,values){
                                var time=new Date(value);
                                var mois=noms_des_mois[time.getMonth()];
                                var annee=time.getFullYear();
                                return mois+" "+annee;
                            }
                        }
                    },
                    y:{
                        type:'linear'
                    }
                },
                plugins:{
                    tooltip:{
                        callbacks:{
                            title: function(context){
                                var time=new Date(liste_mois[context[0].dataIndex])
                                var mois=noms_des_mois[time.getMonth()];
                                var annee=time.getFullYear();
                                return mois+" "+annee;
                            }
                        }
                    },
                    title:{
                        display:true,
                        text:"Contributions par mois"
                    },
                    legend:{
                        display:false
                    }
                }
            }
        };
        Chart_mois = new Chart(
            document.getElementById('chart_mois'),
            config
        );
        Chart_mois.lin_scale = true;
        document.getElementById('chart_mois').onclick=function(){changer_scale(Chart_mois)};


        labels=[];
        valeurs=[];
        var backgroundColor=[];
        liste_type.sort();
        liste_type.forEach(type=>{
            labels.push(type)
            valeurs.push(compte_par_type[type])
            backgroundColor.push(couleur_aleatoire())
        })
        
        var data = {
            labels: labels,
            datasets: [{
            label: 'Contributions',
            backgroundColor: backgroundColor,
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs,
            }]
        };
        var config = {
            type: 'pie',
            data: data,
            options: {
                plugins:{
                    title:{
                        display:true,
                        text:'Contributions par type'
                    },
                    legend:{
                        display:true
                    }
                },
                //spacing: 2,
            }
        };
        chart_type = new Chart(
            document.getElementById('chart_type'),
            config
        );

        labels=[]
        valeurs=[]
        liste_dep.sort();
        liste_dep.forEach(dep=>{
            labels.push(dep)
            valeurs.push(compte_par_dep[dep])
        })
        var data = {
            labels: labels,
            datasets: [{
            label: 'Contributions',
            backgroundColor: 'rgb(190, 190, 245)',
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs,
            }]
        };
        var config = {
            type: 'bar',
            data: data,
            options: {
                plugins:{
                    title:{
                        display:true,
                        text:'Contributions par département'
                    },
                    legend:{
                        display:false
                    }
                },
                scales: lin_scale
            }
        };
        chart_dep = new Chart(
            document.getElementById('chart_dep'),
            config
        );
        chart_dep.lin_scale=true;
        document.getElementById('chart_dep').onclick=function(){changer_scale(chart_dep)}

        labels=[]
        valeurs=[]
        liste_filieres.sort();
        liste_filieres.forEach(filiere=>{
            labels.push(filiere)
            valeurs.push(compte_par_filieres[filiere])
        })
        var data = {
            labels: labels,
            datasets: [{
            label: 'Contributions',
            backgroundColor: 'rgb(190, 190, 245)',
            borderColor: 'rgb(180, 180, 235)',
            data: valeurs,
            }]
        };
        var config = {
            type: 'bar',
            data: data,
            options: {
                plugins:{
                    title:{
                        display:true,
                        text:'Contributions par filière'
                    },
                    legend:{
                        display:false
                    }
                },
                scales: lin_scale
            }
        };
        chart_filiere = new Chart(
            document.getElementById('chart_filiere'),
            config
        );
        chart_dep.lin_scale=true;
        document.getElementById('chart_filiere').onclick=function(){changer_scale(chart_filiere)}
    })
    
}
  
function recreer_graphiques(){
    chart_type.destroy();
    chart_dep.destroy();
    Chart_mois.destroy();
    myChart.destroy();
    myChart2.destroy();
    myChart3.destroy();
    chart_filiere.destroy();
    creer_graphiques();
}

function lister_plaques(){
    if(!en_train_de_jouer){
        if(document.getElementById("div_jeu_plaques")){
            document.getElementById("div_jeu_plaques").remove()
        }
        document.getElementById("ecran_du_jeu").style.gridTemplateColumns="1fr 20%";
        div_infos_plaques=document.createElement("div");
        div_infos_plaques.id='div_jeu_plaques';
        div_infos_plaques.innerHTML="<div style='display:flex;'><h2>Liste des Plaques</h2><button id='X' style='height:30px;margin:20px;'>X</button></div><div id='div_infos_plaques'></div>"
        document.getElementById("ecran_du_jeu").appendChild(div_infos_plaques);
        document.getElementById("div_jeu_plaques").style.maxHeight=document.getElementById("div_jeu_plaques").clientHeight+"px";
        promise
        .then(r => {
            array=r.features;
            for(var i=0; i<array.length;i++){
                let obj = array[i];
                let couleur_obj=couleur_par_nom(obj.properties.Personne)
                if(passer_le_filtre(obj)){
                    elem_liste_plaque=document.createElement("div");
                    elem_liste_plaque.className="elem_liste_plaque";
                    elem_liste_plaque.innerHTML="<h3>"+obj.properties.Personne+"</h3>" + "<h4>"+obj.properties.Type+"</h4>" + "<h4>"+obj.properties.datePubli+"</h4>";
                    if(obj.properties.com_nom){
                        elem_liste_plaque.innerHTML+="<h4>"+obj.properties.com_nom+"</h4>";
                    }
                    if(obj.properties.nom){
                        elem_liste_plaque.innerHTML+="<h4>"+obj.properties.nom+" ("+obj.properties.code+")</h4>";
                    }
                    if(obj.properties.Doublon){
                        if(obj.properties.Doublon>0){
                            elem_liste_plaque.innerHTML+="<h4>Doublon n°"+obj.properties.Doublon+"</h4>";
                        }
                    }	
                    if(obj.properties.Notes){
                        elem_liste_plaque.innerHTML+="<p>"+obj.properties.Notes+"</p>";
                    }
                    if(obj.properties.lien){
                        var lien=obj.properties.lien;
                        if(obj.properties.lien2){
                            lien+=obj.properties.lien2
                        }
                        if(lien.includes("video")){
                            elem_liste_plaque.innerHTML+="<video controls src="+lien+' class="photos_popup">';
                        }else{
                            elem_liste_plaque.innerHTML+="<img src="+lien+' class="photos_popup" alt="Photo indisponible (T_T), elle sera remise d\'ici peu">';
                        }
                    }
                    document.getElementById('div_infos_plaques').appendChild(elem_liste_plaque);
                    document.getElementById('div_infos_plaques').lastChild.firstChild.style.border="3px solid "+couleur_obj;
                    document.getElementById('div_infos_plaques').lastChild.firstChild.style.padding="1px";
                    document.getElementById('div_infos_plaques').lastChild.onclick=function(){
                        mymap.flyTo([obj.geometry.coordinates[1],obj.geometry.coordinates[0]],15);
                    }
                }
            }
        });
        document.getElementById('div_infos_plaques').style.height="100%";
        document.getElementById('X').onclick=afficher_liste_plaques;
    }
}
document.getElementById("button_liste_plaques").onclick=afficher_liste_plaques;
function afficher_liste_plaques(){
    if(!en_train_de_jouer){
        if(document.getElementById("div_jeu_plaques")){
            document.getElementById("div_jeu_plaques").remove()
            document.getElementById("ecran_du_jeu").style.gridTemplateColumns="100%";
        }else{
            lister_plaques();
        }
    }
}

function KNN_estimation(latlon){
    promise
        .then(r => {
            var array=r.features;
            var pt_clicked=latlon;
            var somme_inv_distance=0;
            score_personnes={};
            for(var k=0; k<array.length;k++){
                let obj = array[k];
                if(obj.geometry.coordinates[1]){
                    var d=Math.round(L.CRS.EPSG4326.distance(pt_clicked,L.latLng(obj.geometry.coordinates[1],obj.geometry.coordinates[0])));
                    if(obj.properties.Personne in score_personnes){
                        score_personnes[obj.properties.Personne]+=1/(d**3.5);
                    }else{
                        score_personnes[obj.properties.Personne]=1/(d**3.5);
                    }
                    somme_inv_distance+=1/(d**3.5);
                }
            }
            if(document.getElementById("proba")){
                document.getElementById("proba").innerHTML="<a id='txt_proba' style='cursor: pointer;'>Probabilités (plus proches voisins)</a>"
                document.getElementById('txt_proba').onclick=function(){
                    var html_inner="<ul>";
                    for(personne in score_personnes){
                        score_personnes[personne]=score_personnes[personne]/somme_inv_distance;
                        if(score_personnes[personne]>0.01){
                            html_inner+="<li>"+personne+": "+Math.round(1000*score_personnes[personne])/10+"%</li>";
                        }
                    }
                    document.getElementById("proba").innerHTML+=html_inner+"</ul>";
                    console.log(score_personnes)
                }
                
            }
        })

}

document.getElementById("btn_doublons").onchange=function(){
    filtre_doublon = !document.getElementById("btn_doublons").checked;
    changer_filtre();
    changer_affichage();
}


document.getElementById("localize").onclick=function(){
    mymap.locate({setView: true, maxZoom: 16});
}

function onLocationFound(e) {
    var radius = e.accuracy;

    L.marker(e.latlng).addTo(mymap)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(mymap);
}

mymap.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}

mymap.on('locationerror', onLocationError);


var dynamicStyles = null;

function addAnimation(body) {
    if (!dynamicStyles) {
        dynamicStyles = document.createElement('style');
        dynamicStyles.type = 'text/css';
        document.head.appendChild(dynamicStyles);
    } 

    dynamicStyles.sheet.insertRule(body, dynamicStyles.length);
}

function creer_etoile_feu_artifice(n){
    var nb_branches = 7 + Math.ceil(10*Math.random());
    var scale = 5 + Math.ceil(25*Math.random());
    var x = Math.ceil(0.9 * document.querySelector("body").clientWidth * Math.random());
    var y = Math.ceil(0.8 * document.querySelector("body").clientHeight * Math.random());
    var dx = 30*(0.5-Math.random())
    var etoile = document.createElement("div");
    etoile = document.querySelector("body").appendChild(etoile);
    etoile.style = "overflow:hidden"
    etoile.id="etoile_"+n;
    var Centre = document.createElement("div");
    Centre = etoile.appendChild(Centre);
    var couleur = couleur_aleatoire();
    addAnimation(`
        @keyframes explode_fade_${n} { 
            0%{transform: scale(0.01);}
            10%{transform: scale(0.1) translateY(-20px) translateX(${dx}px); }
            75%{transform: scale(2) translateY(-20px) translateX(${dx}px);}
            100%{background-color: transparent; transform: scale(1.8) translateY(${scale/8 -20}px) translateX(${dx}px);}
        }
    `);
    Centre.style=`background-color:${couleur};width:${scale}px; height:${scale}px; border-radius:${scale/2}px; position:absolute; left:${x}px; top:${y}px; z-index:100000; animation: explode_fade_${n} 1s linear; animation-fill-mode: forwards;`;
    for(let i=0;i<nb_branches;i++){
        var angle = i*2*Math.PI/nb_branches;
        var Pt = document.createElement("div")
        Pt = etoile.appendChild(Pt)
        nx = (x  + 2*scale *Math.cos(angle));
        ny = (scale/4 +y - 2*scale *Math.sin(angle));
        if((Math.PI-angle)<0){
            var final_rotate = -angle
        }else{
            var final_rotate = -angle +0.5*Math.cos(angle);
        }
        addAnimation(`
            @keyframes explode_fade_${n}_${i} { 
                0%{transform: scale(0.01) rotateZ(${-angle}rad);}
                10%{transform: scale(0.1) translateY(-20px) translateX(${dx}px) rotateZ(${-angle}rad);}
                75%{transform: scale(2) translateY(-20px) translateX(${dx}px) rotateZ(${-angle}rad);}
                100%{background-color: transparent; transform: scale(1.8) translateY(${scale/8 -20}px) translateX(${dx}px) rotateZ(${final_rotate}rad);}
            }
        `);
        Pt.style=`background-color:${couleur}; width:${2*scale}px; height:${scale/2}px; border-radius:${scale/2}px; position:absolute;  left:${nx}px; top:${ny}px;
         transform-origin:${scale/2}px; transform:rotateZ(${-angle}rad);z-index:100000; animation: explode_fade_${n}_${i} 1s linear;
         animation-fill-mode: forwards;
         `;
    }
    setTimeout(x=>document.getElementById("etoile_"+n).remove(), 3000)
}


function feu_artifice(nb_etoiles){
    for(let n=compte_feux; n<(compte_feux + nb_etoiles);n++){
        var delay = 500 + Math.ceil(100*Math.random())
        setTimeout(x=>creer_etoile_feu_artifice(n),delay)
    }
    compte_feux =compte_feux + nb_etoiles;
}

var compte_feux = 0;

function celebrer(nb_plaques, date){
    var message_div = document.createElement("div")
    message_div.innerHTML=`
    <h1 style="animation:deplier 1s ease; z-index: 10000000">${nb_plaques} plaques de nivellement, bornes géodésiques, clous, géomètres sauvages, cibles, orgues et autres curiosités ont été atteintes le ${date} !!!!</h1>`
    message_div = document.querySelector("body").appendChild(message_div);
    message_div.style="position:absolute; display:flex; align-items:center; justify-content:center; font-size:3em; z-index:10000; background-color:rgba(0,0,0,0.75); color:red; text-shadow: 4px 4px 6px white; height:"+document.querySelector("body").clientHeight+"px;";
    if(document.getElementById("tada")){
        document.getElementById("tada").play();
    }
    //document.getElementById("firework").play()
    feu_artifice(100);
    setTimeout(x=>message_div.remove(),1500)
}
document.getElementById("titre").onclick=function(){
    celebrer(1500,"26/12/2022");
}

function sauvegarder_image(form_Data){
    fetch('php/sauvegarde_image.php', {
        method: 'POST',
        body: form_Data,
      })
        .then(response => response.text())
        .then(result => {
          // Handle the server response here
          console.log(result);
        })
        .catch(error => {
          // Handle errors here
          console.error(error);
        });
    /*    
    data = 'lien=' + lien+'&name=' + name;
    fetch('php/sauvegarde_image.php', {
        method: 'post',
        body: data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        }).then(r=>{
            console.log(r)
            console.log("Image sauvegardée de "+lien+" à "+name);
            document.getElementById("mod_photo").src="plaques/"+name;
        });
    */
}