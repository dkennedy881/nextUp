import React, { useState, Component, useRef } from "react";
import Axios from "axios";
import { Icon } from "react-native-elements";

//comps
import Queue from "./Queue";
import FilterItem from "./FilterItem";
import HeaderContainer from "../Header/HeaderContainer";

import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from "react-native";

class QueuesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queues: [],
      isSet: false,
      isRefreshing: false,
      selectedQueue: false,
      locationObjs: false,
      selectedLocationObj: false,
      selectedLocationObjReal: false,
      filteredQueues: false,
      doShowInfo: false,
      searchInput: "",
    };
    this.scrollRef = React.createRef();
  }

  setCounterColor = () => {
    const { estMinutes, estHours } = this.state.selectedQueue;
    if (estHours > 0) {
      return styles.metaSectionCenterContentRed;
    }
    if (estMinutes > 39) {
      return styles.metaSectionCenterContentRed;
    }
    if (estMinutes > 24) {
      return styles.metaSectionCenterContentYellow;
    } else {
      return styles.metaSectionCenterContentGreen;
    }
  };

  setCountText = () => {
    const { estMinutes, estHours } = this.state.selectedQueue;
    if (estHours > 0 || estMinutes < 16) {
      return styles.countText;
    } else {
      return {
        fontSize: 30,
        textAlign: "center",
        color: "white",
      };
    }
  };
  setCountTextSub = () => {
    const { estMinutes, estHours } = this.state.selectedQueue;
    if (estHours > 0 || estMinutes < 25) {
      return styles.countTextSub;
    } else {
      return {
        fontSize: 15,
        textAlign: "center",
        color: "black",
      };
    }
  };

  selectLocation = async (location) => {
    let queues = [];
    try {
      queues = await this.getQueues();
    } catch (e) {
      alert(e);
    }
    let filteredQueues = queues.reduce(
      (acc, cur) => {
        if (cur.state === location.state && cur.city === location.city) {
          cur.active && this.getOpen(cur) !== "Closed"
            ? acc.active.push(cur)
            : acc.inactive.push(cur);
        }
        // if (
        //   (cur.city === "" || cur.city === null) &&
        //   location.city === "City Not Specified"
        // ) {
        //   cur.active ? cur.active.push(cur) : cur.inactive.push(cur);
        // }
        return acc;
      },
      { active: [], inactive: [] }
    );
    await this.setState({
      filteredQueues,
      selectedLocationObj: `${location.city}, ${location.state}`,
      selectedLocationObjReal: JSON.parse(JSON.stringify(location)),
      isRefreshing: false,
    });
  };

  getOpen = (queue) => {
    switch (new Date().getDay()) {
      case 1:
        if (queue.monday.active) {
          return queue.monday.open + " - ";
        } else {
          return "Closed";
        }
      case 2:
        if (queue.tuesday.active) {
          return queue.tuesday.open + " - ";
        } else {
          return "Closed";
        }
      case 3:
        if (queue.wednesday.active) {
          return queue.wednesday.open + " - ";
        } else {
          return "Closed";
        }
      case 4:
        if (queue.thursday.active) {
          return queue.thursday.open + " - ";
        } else {
          return "Closed";
        }
      case 5:
        if (queue.friday.active) {
          return queue.friday.open + " - ";
        } else {
          return "Closed";
        }
      case 6:
        if (queue.saturday.active) {
          return queue.saturday.open + " - ";
        } else {
          return "Closed";
        }
      default:
        if (queue.sunday.active) {
          return queue.sunday.open + " - ";
        } else {
          return "Closed";
        }
    }
  };

  selectQueue = async (id) => {
    let queues;
    try {
      queues = await this.getQueues();
    } catch (e) {
      alert(e);
    }
    const selected = queues.filter((q) => {
      return q.id === id;
    })[0];
    this.setState((state) => ({
      ...state,
      selectedQueue: selected,
      doShowInfo: !this.state.doShowInfo,
    }));
  };

  unSelectLocation = async () => {
    await this.setState({
      selectedLocationObj: false,
      selectedLocationObjReal: false,
    });
    this.setState((state) => ({
      ...state,
      selectedLocationObj: false,
      selectedLocationObjReal: false,
      doShowInfo: !this.state.doShowInfo,
    }));
  };

  unSelectQueue = () => {
    this.setState({ selectedQueue: false });
    this.onRefresh();
  };

  onRefresh = async () => {
    await this.setState({ isRefreshing: true });

    let queues = [];
    let locationObjs;
    try {
      queues = await this.getQueues();
    } catch (e) {
      alert(e);
    }

    if (this.state.selectedLocationObj) {
      this.selectLocation(this.state.selectedLocationObjReal);
      return;
    } else {
      locationObjs = queues.reduce((acc, cur) => {
        const newObj = {
          city: cur.city ? cur.city : "City Not Specified",
          state: cur.state,
        };
        if (!this.containsObj(newObj, acc)) {
          acc.push(newObj);
        }
        return acc;
      }, []);
    }

    setTimeout(() => {
      this.setState((state) => ({
        ...state,
        queues,
        filteredQueues: false,
        locationObjs,
        isSet: !state.isSet,
        isRefreshing: false,
      }));
    }, 1000);
  };

  getQueues = () => {
    return new Promise(async (res, rej) => {
      try {
        let { data: queueDataA } = await Axios.post(
          "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/nextup-ssnrm/service/getQueues/incoming_webhook/webhook0"
        );
        queueDataA = await queueDataA.reduce((queues, queueData) => {
          let newJSON = {
            title: queueData.title,
            message: queueData.message,
            monday: queueData.monday,
            tuesday: queueData.tuesday,
            wednesday: queueData.wednesday,
            thursday: queueData.thursday,
            friday: queueData.friday,
            saturday: queueData.saturday,
            sunday: queueData.sunday,
            active: queueData.active,
            count: queueData.count ? queueData.count["$numberLong"] : null,
            id: queueData.id["$numberLong"],
            address: queueData.address,
            zipCode: queueData.zipCode,
            city: queueData.city,
            state: queueData.state,
            maxCount: queueData.maxCount
              ? queueData.maxCount["$numberLong"]
              : null,
            mask: queueData.mask,
            sani: queueData.sani,
            businessNumber: queueData.businessNumber,
            stationCount: queueData.stationCount
              ? queueData.stationCount["$numberLong"]
              : null,
            estHours: queueData.estHours["$numberLong"],
            estMinutes: queueData.estMinutes["$numberLong"],
          };
          queues.push(newJSON);
          return queues;
        }, []);
        res(queueDataA);
      } catch (e) {
        alert(e);
      }
    });
  };

  containsObj(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
      if (JSON.stringify(list[i]) === JSON.stringify(obj)) {
        return true;
      }
    }

    return false;
  }

  getFormattedTime = () => {
    const { estMinutes, estHours } = this.state.selectedQueue;
    const hourString =
      estHours > 0
        ? estHours > 1
          ? `${estHours} hours`
          : `${estHours} hour`
        : "";
    const minuteString =
      estMinutes > 0
        ? estMinutes > 1
          ? `${estMinutes} minutes`
          : `${estMinutes} minute`
        : "";

    return `${hourString} ${minuteString}`;
  };

  async componentDidMount() {
    if (!this.state.isSet) {
      try {
        let queues = await this.getQueues();

        let locationObjs = queues.reduce((acc, cur) => {
          const newObj = {
            city: cur.city ? cur.city : "City Not Specified",
            state: cur.state,
          };
          if (!this.containsObj(newObj, acc)) {
            acc.push(newObj);
          }
          return acc;
        }, []);

        this.setState((state) => ({
          ...state,
          locationObjs,
          queues,
          isSet: !state.isSet,
        }));
      } catch (e) {
        alert(e);
      }
    }
  }

  doRunSearch = () => {};

  render() {
    let {
      isRefreshing,
      selectedQueue,
      locationObjs,
      filteredQueues,
      selectedLocationObj,
      doShowInfo,
    } = this.state;
    let {
      onRefresh,
      selectQueue,
      unSelectQueue,
      unSelectLocation,
      selectLocation,
      setCounterColor,
      setCountText,
      setCountTextSub,
      getFormattedTime,
    } = this;
    return (
      <React.Fragment>
        <HeaderContainer
          unSelectLocation={unSelectLocation}
          selectedLocationObj={selectedLocationObj}
          queueMember={true}
          selectedQueue={selectedQueue}
          doShowInfo={doShowInfo}
        ></HeaderContainer>

        <SafeAreaView
          // contentInsetAdjustmentBehavior="automatic"
          style={{
            flex: 1,
            // display: "flex",
            backgroundColor: `${selectedQueue ? "#9191" : "#f5f5f5"}`,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              height: 40,
              alignItems: "center",
              marginTop: 5,
              marginLeft: 15,
              marginRight: 15,
            }}
          >
            <TextInput
              style={{ width: "80%", height: "90%", paddingLeft: 10 }}
              placeholder="Search"
              backgroundColor="white"
              borderRadius={9}
              onChangeText={() => {}}
            />
            <TouchableOpacity
              style={{
                marginLeft: 5,
                flexDirection: "row",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <Text style={{ fontWeight: "900", color: "#6da8bd" }}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={(ref) => (this.scrollRef = ref)}
            contentContainerStyle={styles.QueuesListContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            // bounces={false}
          >
            {selectedLocationObj === false ? (
              // <FlatList
              //   data={locationObjs}
              //   renderItem={({ item }) => (
              //     <FilterItem
              //       selectQueue={selectQueue}
              //       unSelectQueue={unSelectLocation}
              //       key={`${item.city}-${item.state}`}
              //       name={`${item.city}, ${item.state}`}
              //       obj={{ city: item.city, state: item.state }}
              //       setHandler={selectLocation}
              //     />
              //   )}
              //   keyExtractor={(item) => String(`${item.city}-${item.state}`)}
              // />
              typeof locationObjs === "object" ? (
                locationObjs.map((item, index) => (
                  <FilterItem
                    selectQueue={selectQueue}
                    unSelectQueue={unSelectLocation}
                    key={`${item.city}-${item.state}`}
                    name={`${item.city}, ${item.state}`}
                    obj={{ city: item.city, state: item.state }}
                    setHandler={selectLocation}
                  />
                ))
              ) : (
                <></>
              )
            ) : (
              [
                ...filteredQueues.active,
                ...filteredQueues.inactive,
              ].map((item, index) => (
                <Queue
                  selectQueue={selectQueue}
                  unSelectQueue={unSelectQueue}
                  key={item.id}
                  queue={item}
                  index={index}
                  list={[...filteredQueues.active, ...filteredQueues.inactive]}
                />
              ))
            )}
          </ScrollView>
          {selectedQueue ? (
            <View
              style={{
                width: "100%",
                backgroundColor: "#f5f5f5",
                position: "absolute",
                top: "-7%",
                height: "112.5%",
                zIndex: 1000,
                borderTopRightRadius: 9,
                borderTopLeftRadius: 9,
                borderWidth: 1,
                borderColor: "white",
                paddingBottom: 20,
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  borderTopColor: "white",
                  borderRightColor: "white",
                  borderLeftColor: "white",
                  borderTopRightRadius: 9,
                  borderTopLeftRadius: 9,
                  borderBottomColor: "",
                  backgroundColor: "white",
                  padding: 5,
                  borderWidth: 1,
                  borderColor: "#eee",
                  alignContent: "center",
                  shadowColor: "#f5f5f5",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowRadius: 0.5,
                  shadowOpacity: 1,
                }}
              >
                <View style={{ width: 30 }}></View>
                <View style={{ flex: 1, minHeight: 50 }}>
                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text style={styles.titleText}>{selectedQueue.title}</Text>
                  </View>
                  <Text style={styles.titleTextSub}>
                    {`${selectedQueue.address}, ${selectedQueue.zipCode}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    unSelectQueue();
                  }}
                >
                  <Icon
                    style={{
                      marginRight: 5,
                      marginTop: 3,

                      shadowColor: "#eee",
                      shadowOffset: {
                        width: 1,
                        height: 1,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 0.84,

                      elevation: 1,
                      borderRadius: 9,
                    }}
                    name={"times-circle"}
                    type="font-awesome"
                    color="salmon"
                    size={30}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.metaSectionCenter}>
                  <View style={setCounterColor()}>
                    <Text style={setCountText()}>{getFormattedTime()}</Text>
                  </View>
                </View>
                <View style={styles.metaSectionCenterSub}>
                  {selectedQueue.count ? (
                    <View style={styles.metaLilButtonContainer}>
                      <Text
                        style={styles.metaLilButtonContainerText}
                      >{`${selectedQueue.count} in line`}</Text>
                    </View>
                  ) : (
                    <></>
                  )}
                  {selectedQueue.stationCount ? (
                    <View style={styles.metaLilButtonContainer}>
                      <Text style={styles.metaLilButtonContainerText}>
                        {selectedQueue.stationCount
                          ? `${selectedQueue.stationCount} stations`
                          : "Station # Not Specified"}
                      </Text>
                    </View>
                  ) : (
                    <></>
                  )}
                  {selectedQueue.maxCount ? (
                    <View style={styles.metaLilButtonContainer}>
                      <Text style={styles.metaLilButtonContainerText}>
                        {selectedQueue.maxCount
                          ? `Max Capacity ${selectedQueue.maxCount}`
                          : "Not Specified"}
                      </Text>
                    </View>
                  ) : (
                    <></>
                  )}
                </View>
                <View style={styles.metaSectionNoBg}>
                  <Text style={styles.metaSectionTitleNoBg}>What to Know</Text>
                </View>
                {!selectedQueue.active ? (
                  <View style={styles.metaSectionNoBg}>
                    <Text style={styles.metaSectionTitleNoBgSM}>
                      Currently Unavailable
                    </Text>
                  </View>
                ) : null}
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Masks Required</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.mask ? "Yes" : "No"}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>
                    Sanitizer Available
                  </Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.sani ? "Yes" : "No"}
                    </Text>
                  </View>
                </View>
                {/* <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Max Capacity</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.maxCount}>
                      {selectedQueue.maxCount
                        ? selectedQueue.maxCount
                        : "Not Specified"}
                    </Text>
                  </View>
                </View> */}
                {/* <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Station Count</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.maxCount}>
                      {selectedQueue.stationCount
                        ? selectedQueue.stationCount
                        : "Not Specified"}
                    </Text>
                  </View>
                </View> */}
                {/* <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>
                    Estimated Wait Time
                  </Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    {selectedQueue.estHours < 1 ? (
                      <Text style={styles.maxCount}>
                        {`${selectedQueue.estMinutes} Minute${
                          selectedQueue.estMinutes > 1 ? "s" : ""
                        }`}
                      </Text>
                    ) : (
                      <Text style={styles.maxCount}>
                        {`${selectedQueue.estHours} Hour${
                          selectedQueue.estHours > 1 ? "s" : ""
                        } and ${selectedQueue.estMinutes} Minute${
                          selectedQueue.estMinutes > 1 ? "s" : ""
                        }`}
                      </Text>
                    )}
                  </View>
                </View> */}
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Location Message</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.message}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>
                    Hours of Operation
                  </Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View
                        style={{ width: "100%", flex: 1, flexDirection: "row" }}
                      >
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Monday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                            textAlign: "center",
                          }}
                        >
                          {selectedQueue.monday.active
                            ? selectedQueue.monday.open +
                              " - " +
                              selectedQueue.monday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View style={{ width: "100%", flexDirection: "row" }}>
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Tuesday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          {selectedQueue.tuesday.active
                            ? selectedQueue.tuesday.open +
                              " - " +
                              selectedQueue.tuesday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View style={{ width: "100%", flexDirection: "row" }}>
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Wednesday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          {selectedQueue.wednesday.active
                            ? selectedQueue.wednesday.open +
                              " - " +
                              selectedQueue.wednesday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View style={{ width: "100%", flexDirection: "row" }}>
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Thursday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          {selectedQueue.thursday.active
                            ? selectedQueue.thursday.open +
                              " - " +
                              selectedQueue.thursday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View style={{ width: "100%", flexDirection: "row" }}>
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Friday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          {selectedQueue.friday.active
                            ? selectedQueue.friday.open +
                              " - " +
                              selectedQueue.friday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View style={{ width: "100%", flexDirection: "row" }}>
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Saturday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          {selectedQueue.saturday.active
                            ? selectedQueue.saturday.open +
                              " - " +
                              selectedQueue.saturday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <View>
                      <View style={{ width: "100%", flexDirection: "row" }}>
                        <Text
                          style={{
                            width: 110,
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          Sunday
                        </Text>
                        <Text
                          style={{
                            fontWeight: "300",
                            fontSize: 20,
                            marginTop: 5,
                            marginBottom: 5,
                          }}
                        >
                          {selectedQueue.sunday.active
                            ? selectedQueue.sunday.open +
                              " - " +
                              selectedQueue.sunday.close
                            : "Closed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Phone Number</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.businessNumber}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>City</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.city}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>State</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.state}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Address</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Zipcode</Text>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Text style={styles.metaSectionData}>
                      {selectedQueue.zipCode}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          ) : (
            <></>
          )}
        </SafeAreaView>
      </React.Fragment>
    );
  }
}

// https://reactnative.dev/docs/refreshcontrol
export default QueuesList;

const styles = StyleSheet.create({
  metaLilButtonContainer: {
    marginLeft: 5,
    marginRight: 5,
    borderStyle: "solid",
    borderWidth: 0.5,
    padding: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 9,
    backgroundColor: "#8ecfd4",
    borderColor: "#eee",
    color: "white",
  },
  metaLilButtonContainerText: {
    color: "white",
  },
  QueuesListContainer: {
    borderColor: "#eeee",
    borderStyle: "solid",
    // overflow: 'scroll',
    position: "relative",
    top: 1,
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "pink",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 30,
    color: "black",
    fontWeight: "300",
    textAlign: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  titleTextSub: {
    fontSize: 10,
    color: "black",
    fontWeight: "300",
    textAlign: "center",
  },
  metaSection: {
    padding: 15,
    paddingLeft: 65,
    paddingRight: 65,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 5,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
  },
  metaSectionNoBg: {
    padding: 15,
    paddingLeft: 65,
    paddingRight: 65,
    marginBottom: -5,
    marginTop: 5,
  },
  metaSectionCenter: {
    padding: 15,
    marginBottom: 5,
    marginRight: 15,
    marginLeft: 15,
    marginTop: 5,
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
  },
  metaSectionCenterSub: {
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
  },
  metaSectionCenterContent: {
    padding: 15,
    backgroundColor: "#8ecfd4",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
    // width: "50%",
    minWidth: 110,
    height: 110,
    // marginLeft: 50,
    // marginRight: 50,
    marginBottom: -10,
  },
  metaSectionCenterContentRed: {
    padding: 15,
    backgroundColor: "red",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
    // width: "50%",
    minWidth: 110,
    // height: 80,
    alignSelf: "center",
    // marginLeft: 50,
    // marginRight: 50,
    // marginBottom: -10,
  },
  metaSectionCenterContentGreen: {
    padding: 15,
    backgroundColor: "#57ab53",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
    // width: "50%",
    minWidth: 110,
    alignSelf: "center",
    // marginLeft: 50,
    // marginRight: 50,
    // marginBottom: -10,
  },
  metaSectionCenterContentYellow: {
    padding: 15,
    backgroundColor: "#ffdf6d",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
    // width: "50%",
    minWidth: 110,
    alignSelf: "center",
    // marginLeft: 50,
    // marginRight: 50,
  },
  countTextContainer: {
    paddingTop: 50,
    paddingBottom: 50,
    backgroundColor: "#6da8bd",
    borderTopRightRadius: 9,
    borderTopLeftRadius: 9,
  },
  countText: {
    fontSize: 30,
    textAlign: "center",
    color: "white",
  },
  countTextSub: {
    fontSize: 15,
    textAlign: "center",
    color: "yellow",
  },
  metaSectionFilterHide: {
    padding: 15,
    backgroundColor: "#a8a8a8",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 5,
    marginRight: 15,
    marginLeft: 15,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
    textAlign: "center",
  },
  metaSectionFilter: {
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 5,
    marginRight: 15,
    marginLeft: 15,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
    textAlign: "center",
  },

  metaSectionFilterText: {
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    fontSize: 22,
  },

  metaSectionLast: {
    padding: 15,
    marginBottom: 100,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 5,
    marginRight: 15,
    marginLeft: 15,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 0.84,

    elevation: 1,
    borderRadius: 9,
  },
  metaSectionTitle: {
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 5,
  },
  metaSectionTitleNoBg: {
    fontWeight: "300",
    marginTop: 5,
    marginBottom: 5,
    fontSize: 25,
    textAlign: "center",
  },
  metaSectionTitleNoBgSM: {
    fontWeight: "300",
    marginTop: -15,
    marginBottom: 5,
    fontSize: 15,
    textAlign: "center",
  },
  metaSectionData: {
    fontWeight: "300",
    fontSize: 20,
    marginTop: 5,
    marginBottom: 5,
  },
});
