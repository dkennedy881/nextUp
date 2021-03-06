import React, { useState, Component } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";

function Step1({
  forwardState,
  toggleLogInSignUp,
  updatePhoneNumber,
  phoneNumber,
  updateName,
  name,
  password,
  passwordValidate,
  updatePassword,
  updatePasswordValidate,
}) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <Text style={styles.signUpTitleText}>Sign Up</Text>
        <View style={styles.signUpFieldTextContainer}>
          <Text style={styles.signUpFieldText}>Business Name: </Text>
          <TextInput
            value={name}
            style={styles.inputField}
            onChangeText={(text) => updateName(text)}
            placeholder="Awesome Business"
          />
        </View>
        <View style={styles.signUpFieldTextContainer}>
          <Text style={styles.signUpFieldText}>Phone Number: </Text>
          <TextInput
            value={phoneNumber}
            style={styles.inputField}
            onChangeText={(text) => updatePhoneNumber(text)}
            placeholder="Phone Number"
          />
        </View>
        <View style={styles.signUpFieldTextContainer}>
          <Text style={styles.signUpFieldText}>Password: </Text>
          <TextInput
            value={password}
            style={styles.inputField}
            onChangeText={(text) => updatePassword(text)}
            placeholder="Account Password"
          />
        </View>
        <View style={styles.signUpFieldTextContainer}>
          <Text style={styles.signUpFieldText}>Re-enter Password: </Text>
          <TextInput
            value={passwordValidate}
            style={styles.inputField}
            onChangeText={(text) => updatePasswordValidate(text)}
            placeholder="Re-enter Account Password"
          />
        </View>
        <View style={styles.signUpFieldBtnContainer}>
          <TouchableOpacity style={styles.signInBtn} onPress={forwardState}>
            <Text>Verify Account</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.signUpFieldBtnContainer}>
          <TouchableOpacity
            style={styles.forgotPasswordBtn}
            onPress={toggleLogInSignUp}
          >
            <Text>Already have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default Step1;

const styles = StyleSheet.create({
  signUpContainer: {
    borderColor: "#eeee",
    borderStyle: "solid",
    borderWidth: 1,
    padding: 30,
  },
  signUpSimpleText: {
    marginTop: 15,
  },
  skipBtn: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 15,
    paddingLeft: 15,
  },
  signUpFieldTextContainer: {
    display: "flex",
    flexDirection: "row",
    marginTop: 15,
  },
  signUpFieldBtnContainer: {
    display: "flex",
    marginTop: 15,
    flexDirection: "row-reverse",
  },
  signInBtn: {
    borderColor: "#eeee",
    borderStyle: "solid",
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 15,
    paddingLeft: 15,
    borderRadius: 9,
  },
  forgotPasswordBtn: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 15,
    paddingLeft: 15,
  },
  signUpTitleText: {
    fontSize: 25,
  },
  signUpFieldText: {
    fontSize: 15,
  },
  inputField: {
    flex: 1,
    borderWidth: 0.5,
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#cccc",
  },
});
