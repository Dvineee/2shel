-- =========================================================
-- Supabase Functions and Triggers
-- =========================================================

-- Trigger to automatically create profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, coin_balance, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80'),
    100, -- Welcome gift 100 coins
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Secure Stored Procedure: Spin Daily Wheel
CREATE OR REPLACE FUNCTION public.spin_wheel(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_spins_today INTEGER;
  v_reward RECORD;
  v_total_prob NUMERIC;
  v_random NUMERIC;
  v_running_prob NUMERIC := 0;
BEGIN
  -- 1. Check if user already spun today
  SELECT COUNT(*) INTO v_spins_today
  FROM public.wheel_spins
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', NOW());

  IF v_spins_today >= 1 THEN
    RAISE EXCEPTION 'Bugünkü çark çevirme hakkınızı zaten kullandınız. Yarın tekrar bekleriz!';
  END IF;

  -- 2. Select a random active reward based on probability weights
  SELECT SUM(probability) INTO v_total_prob FROM public.wheel_rewards WHERE active = true;
  IF v_total_prob IS NULL OR v_total_prob <= 0 THEN
    v_total_prob := 100;
  END IF;

  v_random := random() * v_total_prob;

  FOR v_reward IN
    SELECT * FROM public.wheel_rewards WHERE active = true ORDER BY sort_order ASC
  LOOP
    v_running_prob := v_running_prob + COALESCE(v_reward.probability, 10);
    IF v_random <= v_running_prob THEN
      EXIT;
    END IF;
  END LOOP;

  -- 3. If no reward found, pick the first one
  IF v_reward.id IS NULL THEN
    SELECT * INTO v_reward FROM public.wheel_rewards WHERE active = true LIMIT 1;
  END IF;

  -- 4. Record the spin
  INSERT INTO public.wheel_spins (user_id, reward_id, reward_title, reward_value)
  VALUES (p_user_id, v_reward.id, v_reward.title, COALESCE(v_reward.reward_value, 0));

  -- 5. Update user's coin balance if coin reward
  IF v_reward.reward_type = 'coin' AND v_reward.reward_value > 0 THEN
    UPDATE public.profiles
    SET coin_balance = coin_balance + v_reward.reward_value,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward_id', v_reward.id,
    'reward_title', v_reward.title,
    'reward_type', v_reward.reward_type,
    'reward_value', v_reward.reward_value,
    'color', v_reward.color
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure Stored Procedure: Purchase Store Product
CREATE OR REPLACE FUNCTION public.purchase_product(p_user_id UUID, p_product_id UUID, p_delivery_note TEXT DEFAULT '')
RETURNS JSONB AS $$
DECLARE
  v_user_balance INTEGER;
  v_price INTEGER;
  v_stock INTEGER;
  v_order_id UUID;
BEGIN
  -- Get user coin balance
  SELECT coin_balance INTO v_user_balance FROM public.profiles WHERE id = p_user_id;
  IF v_user_balance IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı.';
  END IF;

  -- Get product price & stock
  SELECT coin_price, stock INTO v_price, v_stock FROM public.store_products WHERE id = p_product_id AND active = true;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Ürün bulunamadı veya satışta değil.';
  END IF;

  IF v_stock <= 0 THEN
    RAISE EXCEPTION 'Ürün stokta kalmadı.';
  END IF;

  IF v_user_balance < v_price THEN
    RAISE EXCEPTION 'Yetersiz coin bakiyesi! Gereken: % Coin, Bakiyeniz: % Coin', v_price, v_user_balance;
  END IF;

  -- Deduct coin balance
  UPDATE public.profiles
  SET coin_balance = coin_balance - v_price,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Decrease stock
  UPDATE public.store_products
  SET stock = stock - 1
  WHERE id = p_product_id;

  -- Insert order
  INSERT INTO public.store_orders (user_id, product_id, coin_price, status, delivery_note)
  VALUES (p_user_id, p_product_id, v_price, 'completed', p_delivery_note)
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'remaining_balance', (v_user_balance - v_price)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
