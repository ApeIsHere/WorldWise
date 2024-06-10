import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
const BASE_URL = "http://localhost:8000";

const CitiesContext = createContext();
const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        isLoading: true,
      };
    case "cities/loaded":
      return {
        ...state,
        isLoading: false,
        cities: action.payload,
      };

    case "city/loaded":
      return {
        ...state,
        isLoading: false,
        currentCity: action.payload,
      };
    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };

    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };
    case "rejected":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    default:
      throw new Error("Unknown action type");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );

  //-------------Local Storage----------------
  //-----------Temporary Deployment Solution------

  useEffect(function () {
    function fetchCities() {
      const localStorageCities = JSON.parse(localStorage.getItem("cities"));

      if (localStorageCities) {
        dispatch({ type: "loading" });
        dispatch({ type: "cities/loaded", payload: localStorageCities });
      } else {
        return;
      }
    }
    fetchCities();
  }, []);

  const getCity = useCallback(
    function getCity(id) {
      if (Number(id) === currentCity.id) return;

      dispatch({ type: "loading" });

      try {
        const localStorageCities = JSON.parse(localStorage.getItem("cities"));
        const selectedCity = localStorageCities.find(
          (selectedCity) => selectedCity.id === id
        );

        if (selectedCity) {
          dispatch({ type: "city/loaded", payload: selectedCity });
        } else {
          dispatch({ type: "rejected", payload: "There was an error loading city..." });
        }
      } catch (err) {
        dispatch({ type: "rejected", payload: "Error loading city from local storage" });
      }
    },
    [currentCity.id]
  );

  function createCity(newCity) {
    const generateId = () => {
      return Math.floor(Math.random() * 1000000) + Date.now().toString().slice(-6);
    };

    const cityWithId = {
      ...newCity,
      id: generateId(),
    };

    dispatch({ type: "loading" });
    dispatch({ type: "city/created", payload: cityWithId });

    const updatedCities = [...cities, cityWithId];
    localStorage.setItem("cities", JSON.stringify(updatedCities));
  }

  function deleteCity(id) {
    dispatch({ type: "loading" });
    dispatch({ type: "city/deleted", payload: id });

    const updatedCities = cities.filter((city) => city.id !== id);
    localStorage.setItem("cities", JSON.stringify(updatedCities));
  }

  //---------------------API------------------

  // useEffect(function () {
  //   async function fetchCities() {
  //     dispatch({ type: "loading" });
  //     try {
  //       const res = await fetch(`${BASE_URL}/cities`);
  //       const data = await res.json();
  //       dispatch({ type: "cities/loaded", payload: data });
  //     } catch {
  //       dispatch({ type: "rejected", payload: "There was an error loading cities..." });
  //     }
  //   }
  //   fetchCities();
  // }, []);

  // const getCity = useCallback(
  //   async function getCity(id) {
  //     if (Number(id) === currentCity.id) return;

  //     dispatch({ type: "loading" });

  //     try {
  //       const res = await fetch(`${BASE_URL}/cities/${id}`);
  //       const data = await res.json();
  //       dispatch({ type: "city/loaded", payload: data });
  //     } catch {
  //       dispatch({ type: "rejected", payload: "There was an error loading city..." });
  //     }
  //   },
  //   [currentCity.id]
  // );

  // async function createCity(newCity) {
  //   dispatch({ type: "loading" });

  //   try {
  //     const res = await fetch(`${BASE_URL}/cities`, {
  //       method: "POST",
  //       body: JSON.stringify(newCity),
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const data = await res.json();
  //     dispatch({ type: "city/created", payload: data });
  //   } catch {
  //     dispatch({ type: "rejected", payload: "There was an error creating city..." });
  //   }
  // }

  // async function deleteCity(id) {
  //   dispatch({ type: "loading" });

  //   try {
  //     await fetch(`${BASE_URL}/cities/${id}`, {
  //       method: "DELETE",
  //     });

  //     dispatch({ type: "city/deleted", payload: id });
  //   } catch {
  //     dispatch({ type: "rejected", payload: "There was an error deleting city..." });
  //   }
  // }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        error,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error("CitiesContext was used outside CitiesProvider");
  return context;
}

export { CitiesProvider, useCities };
