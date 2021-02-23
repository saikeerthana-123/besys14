import React,{Component} from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  Alert} from 'react-native';
import db from '../config';
import firebase from 'firebase';
import MyHeader from '../components/MyHeader'

export default class RequestScreen extends Component{
  constructor(){
    super();
    this.state ={
      userId : firebase.auth().currentUser.email,
      Name:"",
      reasonToRequest:"",
      IsRequestActive:"",
      requestedname:"",
      Status:"",
      requestId:"",
      currencyCode:'',
      docId:"",
      userDocId:""
    }
  }

  createUniqueId(){
    return Math.random().toString(36).substring(7);
  }

  componentDidMount(){
    this.getRequest()
    this.getIsRequestActive()
  }
  
  getIsRequestActive=()=>{
    db.collection('users').where('email_id','==',this.state.userId)
    .onSnapshot(querySnapshot => { querySnapshot.forEach(doc => {
       this.setState({
          IsRequestActive:doc.data().IsRequestActive,
          userDocId : doc.id 
        }) 
      }) 
    })
  }

  getData(){
    fetch("http://data.fixer.io/api/latest?access_key=ee140b947bf2e854ebd340f75a4fd658")
    .then(response=>{
      return response.json();
    }).then(responseData =>{
      var currencyCode = this.state.currencyCode
      var currency = responseData.rates.INR
      var value =  69 / currency
      console.log(value);
    })
    }

  getRequest=()=>{
    var Request = db.collection('requested').where('user_id','==',this.state.userId).get()
    .then((snapshot)=>{
      snapshot.forEach((doc) => {
        if(doc.data().status!=='received'){
          this.setState({
          "requestId" : doc.data().request_id,
          "requestedname": doc.data().name,
          "Status":doc.data().status,
          "docId": doc.id
        })}
      });
  })
  }

  sendNotification=()=>{
    db.collection('users').where('email_id','==',this.state.userId).get()
    .then((snapshot)=>{
       snapshot.forEach((doc)=>{
          var name = doc.data().first_name 
          var lastName = doc.data().last_name
          // to get the donor id and book nam
         db.collection('all_notifications').where('request_id','==',this.state.requestId).get()
          .then((snapshot)=>{ 
            snapshot.forEach((doc) => { 
              var donorId = doc.data().donor_id 
              var bookName = doc.data().book_name 
              //targert user id is the donor id to send notification to the user
             db.collection('all_notifications').add({
                "targeted_user_id" : donorId,
                 "message" : name+" " + lastName + " received the book " + bookName + ". The reciever sent this note:" + this.state.thankYouMessage , 
                 "notification_status" : "unread", "book_name" : bookName 
                }) 
              }) 
            }) 
          }) 
        })
  }

  addRequest =async(Name,reasonToRequest)=>{
    var userId = this.state.userId
    var randomRequestId = this.createUniqueId()
    db.collection('requested').add({
        "user_id": userId,
        "name":Name,
        "reason_to_request":reasonToRequest,
        "request_id"  : randomRequestId,
        status:'requested',
        currencyCode:this.state.getData(),
        date:firebase.firestore.FieldValue.serverTimestamp()
    })

      await this.getRequest()
      db.collection('users').where('email_id','==',this.state.userId).get()
      .then((snapshot)=>{
        snapshot.forEach((doc) => {
          db.collection('users').doc(doc.id).update({
            IsRequestActive:true
          })
        });
    })

    this.setState({
        Name :'',
        reasonToRequest : '',
        request_id:randomRequestId
    })

    return Alert.alert("Requested Successfully")
  }

  render(){
    console.log(this.state.IsRequestActive)
    if(this.state.IsRequestActive==true){
      return(
      <View style={{flex:1}}>
        <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
          <Text>Name</Text>
          <Text>{this.state.requestedname}</Text>
        </View>
        <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
          <Text>Status</Text>
          <Text>{this.state.Status}</Text>
        </View>
        <View style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}>
          <Text>Cost{this.state.currencyCode}</Text>
        </View>
        <TextInput style={{borderColor:"orange",borderWidth:2,justifyContent:'center',alignItems:'center',padding:10,margin:10}}
                    placeholder='thank you message'
                    onChangeText={(text)=>{
                      this.setState({thankYouMessage:text})}}
                    value = {this.state.thankYouMessage}
        ></TextInput>
      </View>)
    }
    else{
    return(
        <View style={{flex:1}}>
          <MyHeader title="Request" navigation ={this.props.navigation}/>
            <KeyboardAvoidingView style={styles.keyBoardStyle}>
              <TextInput
                style ={styles.formTextInput}
                placeholder={"enter name"}
                onChangeText={(text)=>{
                    this.setState({
                        Name:text
                    })
                }}
                value={this.state.Name}
              />
              <TextInput
                style ={[styles.formTextInput,{height:300}]}
                multiline
                numberOfLines ={8}
                placeholder={"Why do you need"}
                onChangeText ={(text)=>{
                    this.setState({
                        reasonToRequest:text
                    })
                }}
                value ={this.state.reasonToRequest}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={()=>{this.addRequest(this.state.Name,this.state.reasonToRequest)}}
                >
                <Text>Request</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    )}
  }
}

const styles = StyleSheet.create({
  keyBoardStyle : {
    flex:1,
    alignItems:'center',
    justifyContent:'center'
  },
  formTextInput:{
    width:"75%",
    height:35,
    alignSelf:'center',
    borderColor:'#ffab91',
    borderRadius:10,
    borderWidth:1,
    marginTop:20,
    padding:10,
  },
  button:{
    width:"75%",
    height:50,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:10,
    backgroundColor:"#ff5722",
    shadowColor: "#000",
    shadowOffset: {
       width: 0,
       height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    marginTop:20
    },
  }
)
