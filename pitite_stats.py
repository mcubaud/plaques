import geojson
import datetime
import matplotlib.pyplot as plt
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
import pickle

plt.close('all')

# Les_dates={}
# Les_mois={}
# contributeurs={}
# with open('plaques.geojson') as json_data:
#     data_dict = geojson.load(json_data,encoding='utf-8')
#     data_dict=data_dict.popitem()[1]
#     for i in range(len(data_dict)):
#         plaque=data_dict[i]
#         print(plaque)
#         date_str=plaque["properties"]["datePubli"]
#         if date_str:
#             date=datetime.date(int(date_str[0:4]),int(date_str[5:7]),int(date_str[8:10]))
#             date_sans_jour=datetime.date(int(date_str[0:4]),int(date_str[5:7]),1)
#             personne=plaque["properties"]["Personne"].replace('Ã©','é').replace('Ã‰','É')
#             if not (contributeurs.__contains__(personne)):
#                 contributeurs[personne]=1
#             else:
#                 contributeurs[personne]+=1
#
#
#             if not (Les_dates.__contains__(date)):
#                 Les_dates[date]=1
#             else:
#                 Les_dates[date]+=1
#
#             if not (Les_mois.__contains__(date_sans_jour)):
#                 Les_mois[date_sans_jour]=1
#             else:
#                 Les_mois[date_sans_jour]+=1

"""
L=[list(Les_dates.values()),list(Les_dates.keys())]
Lnp=np.array(L)
keys=np.lexsort(Lnp)
plt.bar(Lnp[1,keys],Lnp[0,keys])
plt.plot(Lnp[1,keys],Lnp[0,keys],'o')
plt.title("contributions par jour")
indmax=np.argmax(Lnp[0])
print("maximum le "+str(Lnp[1,indmax])+" : "+str(Lnp[0,indmax]))

plt.figure()

L=[list(Les_mois.values()),list(Les_mois.keys())]
Lnp=np.array(L)
keys=np.lexsort(Lnp)
plt.plot(Lnp[1,keys],Lnp[0,keys],'-o')
plt.title("contributions par mois")
indmax=np.argmax(Lnp[0])
print("maximum le mois "+str(Lnp[1,indmax].month)+" "+str(Lnp[1,indmax].year)+" : "+str(Lnp[0,indmax]))




fig1, ax1 = plt.subplots()
ax1.pie(contributeurs.values(), labels=contributeurs.keys(), autopct='%1.1f%%', startangle=90,rotatelabels=True)
ax1.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.





plt.show()
"""
coord_plaques=[]
noms_plaques=[]
numero=-1
num_gens=[]
gens_num=[]
with open('plaques.geojson') as json_data:
    data_dict = geojson.load(json_data,encoding='utf-8')
    data_dict=data_dict.popitem()[1]
    for i in range(len(data_dict)):
        plaque=data_dict[i]
        #print(plaque)
        personne=plaque["properties"]["Personne"].replace('Ã©','é').replace('Ã‰','É')
        if True:#personne in ["Célestin","Nick","Martin Cubaud"]:
            if personne in noms_plaques:
                k=noms_plaques.index(personne)
                num_gens.append(num_gens[k])
            else:
                numero+=1
                num_gens.append(numero)
                gens_num.append(personne)
            noms_plaques.append(personne)
            coord_plaques.append(plaque["geometry"]["coordinates"])


# plaques_celestin=np.array(plaques_celestin)
# kmeans = KMeans(n_clusters=8).fit(plaques_martin)
# np.savetxt("centroids_florian.txt",kmeans.cluster_centers_)
pt=np.array(coord_plaques)

# #Recherche des doublons
# for plaque1 in pt:
#     for plaque2 in pt:
#         dist = ((plaque1[0]-plaque2[0])**2+(plaque1[1]-plaque2[1])**2)**0.5
#         if dist!=0 and dist<0.00005:
#             print(plaque1, plaque2)


num_gens=np.array(num_gens)
clf = RandomForestClassifier(n_estimators=20)
#clf = make_pipeline(StandardScaler(), SVC(gamma='scale',C=1e9))
clf = clf.fit(coord_plaques[::], num_gens[::])
print("score:",clf.score(coord_plaques[::], num_gens[::]))

#Enregistrement du classifieur :
pkl_filename="clf.pkl"
with open(pkl_filename,'wb') as file:
    pickle.dump(clf,file)

#Chargement du classifieur :
with open(pkl_filename,'rb') as file:
    clf2=pickle.load(file)

xmin=pt[:,0].min()
ymin=pt[:,1].min()
xmax=pt[:,0].max()
ymax=pt[:,1].max()
N=100
dx=(xmax-xmin)/N
dy=(ymax-ymin)/N
pt_test=[]
pt_test.append([[xmin+dx*i for i in range(N)] for j in range(N)])
pt_test.append([[ymin+dy*j for i in range(N)] for j in range(N)])
pt_test=np.array(pt_test).T.reshape((N**2,2))
num_predits=clf.predict(pt_test)
img=np.vstack((pt_test[:,0],pt_test[:,1],num_predits)).T
plt.scatter(img[:,0],img[:,1],c=img[:,2],cmap="tab20c")
csv=np.vstack((pt_test[:,0],pt_test[:,1],np.array(gens_num)[num_predits])).T
np.savetxt("predictions.txt",csv, fmt='%s',delimiter=',')
plt.scatter(pt[:,0],pt[:,1],c=num_gens,edgecolors="k",cmap="tab20c")
plt.colorbar()


plt.figure()
xmin=2.103921
ymin=48.394429
xmax=3.082535
ymax=48.957262
N=100
dx=(xmax-xmin)/N
dy=(ymax-ymin)/N
pt_test=[]
pt_test.append([[xmin+dx*i for i in range(N)] for j in range(N)])
pt_test.append([[ymin+dy*j for i in range(N)] for j in range(N)])
pt_test=np.array(pt_test).T.reshape((N**2,2))
num_predits=clf.predict(pt_test)
img=np.vstack((pt_test[:,0],pt_test[:,1],num_predits)).T
plt.scatter(img[:,0],img[:,1],c=img[:,2],cmap="tab20c")
csv=np.vstack((pt_test[:,0],pt_test[:,1],np.array(gens_num)[num_predits])).T
np.savetxt("predictions2.txt",csv, fmt='%s',delimiter=',')

plt.scatter(pt[:,0],pt[:,1],c=num_gens,edgecolors="k",cmap="tab20c")
plt.colorbar()
plt.show()