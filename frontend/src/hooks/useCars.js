import { useState, useEffect } from 'react';
import { carService } from '../services/car.service';

export const useCars = (params = {}) => {
  const [cars, setCars] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      const result = await carService.getCars(params);
      
      if (result.success) {
        setCars(result.cars);
        setPagination(result.pagination);
        setError(null);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchCars();
  }, [JSON.stringify(params)]);

  return { cars, pagination, loading, error };
};

export const useCarDetails = (carId, params = {}) => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!carId) return;

    const fetchCar = async () => {
      setLoading(true);
      const result = await carService.getCarById(carId, params);
      
      if (result.success) {
        setCar(result.car);
        setError(null);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchCar();
  }, [carId, JSON.stringify(params)]);

  return { car, loading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const result = await carService.getCategories();
      
      if (result.success) {
        setCategories(result.categories);
        setError(null);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      const result = await carService.getBrands();
      
      if (result.success) {
        setBrands(result.brands);
        setError(null);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchBrands();
  }, []);

  return { brands, loading, error };
};
